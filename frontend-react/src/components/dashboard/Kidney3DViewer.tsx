import React, { Suspense, useRef, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, Html, Center, useGLTF } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { RotateCcw, ZoomIn, ZoomOut, Play, Pause, Sparkles } from 'lucide-react';
import {
  createKidneyGeometry,
  createKidneyDiffuseTexture,
  createKidneyBumpTexture,
  createVesselCurves,
} from './kidneyGeometry';

/**
 * Loads the user-supplied anatomical 3D GLB model (/models/human_kidney.glb)
 * Automatically centers and scales the asset.
 */
function GlbKidneyModel({ modelUrl }: { modelUrl: string }) {
  const gltf = useGLTF(modelUrl);

  const modelScene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          // Enhance organic gloss and reflectivity
          child.material.roughness = THREE.MathUtils.clamp(
            child.material.roughness ?? 0.3,
            0.15,
            0.45
          );
          child.material.metalness = THREE.MathUtils.clamp(
            child.material.metalness ?? 0.05,
            0.0,
            0.15
          );
          if ('clearcoat' in child.material) {
            child.material.clearcoat = 0.85;
            child.material.clearcoatRoughness = 0.15;
          }
        }
      }
    });
    return clone;
  }, [gltf.scene]);

  return (
    <Center top={false}>
      <primitive object={modelScene} scale={1.12} />
    </Center>
  );
}

/**
 * High-fidelity procedural fallback if no GLB is present
 */
function ProceduralFallbackKidney() {
  const kidneyGeo = useMemo(() => createKidneyGeometry(), []);
  const diffuseMap = useMemo(() => createKidneyDiffuseTexture(), []);
  const bumpMap = useMemo(() => createKidneyBumpTexture(), []);
  const { arteryTrunk, arteryUpperBranch, veinTrunk, ureterPath } = useMemo(
    () => createVesselCurves(),
    []
  );

  return (
    <group position={[0, 0.05, 0]} rotation={[0.05, -0.4, 0]} scale={1.15}>
      <mesh geometry={kidneyGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          map={diffuseMap}
          bumpMap={bumpMap}
          bumpScale={0.035}
          color="#7D1E1E"
          roughness={0.2}
          metalness={0.03}
          clearcoat={0.92}
          clearcoatRoughness={0.12}
          reflectivity={0.8}
          sheen={0.4}
          sheenColor={new THREE.Color('#A82828')}
          ior={1.42}
        />
      </mesh>
      <mesh position={[0.1, -0.22, -0.06]} rotation={[0.2, 0, -0.3]} castShadow>
        <coneGeometry args={[0.22, 0.45, 24, 1, true]} />
        <meshStandardMaterial color="#C7A27C" roughness={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[ureterPath, 64, 0.075, 18, false]} />
        <meshStandardMaterial color="#C9A882" roughness={0.38} />
      </mesh>
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[arteryTrunk, 48, 0.09, 18, false]} />
        <meshStandardMaterial color="#D32F2F" roughness={0.25} />
      </mesh>
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[arteryUpperBranch, 36, 0.068, 16, false]} />
        <meshStandardMaterial color="#E53935" roughness={0.25} />
      </mesh>
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[veinTrunk, 48, 0.115, 20, false]} />
        <meshStandardMaterial color="#1565C0" roughness={0.28} />
      </mesh>
    </group>
  );
}

class ModelErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export interface Kidney3DViewerProps {
  modelUrl?: string;
  className?: string;
}

const Kidney3DViewerInner: React.FC<Kidney3DViewerProps> = ({
  modelUrl = '/models/human_kidney.glb',
  className = '',
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.target.set(0, 0, 0);
      const camera = controlsRef.current.object as THREE.PerspectiveCamera;
      camera.position.set(0, 0.05, 2.7);
      controlsRef.current.update();
    }
  };

  const handleZoomIn = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object as THREE.PerspectiveCamera;
      camera.position.multiplyScalar(0.82);
      controlsRef.current.update();
    }
  };

  const handleZoomOut = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object as THREE.PerspectiveCamera;
      camera.position.multiplyScalar(1.18);
      controlsRef.current.update();
    }
  };

  return (
    <div
      className={`relative w-full h-full min-h-[250px] lg:min-h-[265px] rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-md overflow-hidden flex flex-col ${className}`}
    >
      {/* Top Banner */}
      <div className="absolute top-2.5 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-850/90 backdrop-blur-md border border-slate-700 shadow-sm text-[10px] font-medium text-slate-200">
          <Sparkles className="w-3 h-3 text-rose-400" />
          3D Anatomy
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="w-full h-full flex-1 cursor-grab active:cursor-grabbing">
        <Canvas
          camera={{ position: [0, 0.05, 2.7], fov: 40 }}
          shadows
          gl={{ antialias: true, alpha: true }}
        >
          {/* Medical Studio Lighting Rig */}
          <ambientLight intensity={1.1} />
          {/* Main Key Light */}
          <directionalLight
            position={[5, 6, 5]}
            intensity={2.2}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-bias={-0.0001}
          />
          {/* Soft Cool Fill Light */}
          <directionalLight position={[-5, 2, 3]} intensity={1.0} color="#dbeafe" />
          {/* Rear Rim/Contour Light */}
          <directionalLight position={[0, 4, -5]} intensity={1.8} color="#fca5a5" />
          <directionalLight position={[-3, -4, -3]} intensity={0.9} color="#93c5fd" />

          <Suspense
            fallback={
              <Html center>
                <div className="flex flex-col items-center gap-2.5">
                  <div className="w-9 h-9 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-slate-300 font-medium">
                    Loading Anatomical 3D Model...
                  </span>
                </div>
              </Html>
            }
          >
            <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.15}>
              <ModelErrorBoundary fallback={<ProceduralFallbackKidney />}>
                <GlbKidneyModel modelUrl={modelUrl} />
              </ModelErrorBoundary>
            </Float>
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.07}
            autoRotate={autoRotate}
            autoRotateSpeed={1.1}
            minDistance={1.4}
            maxDistance={8.0}
            maxPolarAngle={Math.PI / 1.12}
            minPolarAngle={Math.PI / 8}
          />
        </Canvas>
      </div>

      {/* Floating Control Toolbar */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700 shadow-lg">
        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
            autoRotate
              ? 'bg-rose-950 text-rose-300 border border-rose-700'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title={autoRotate ? 'Pause rotation' : 'Start auto-rotation'}
          aria-label={autoRotate ? 'Pause auto-rotation' : 'Start auto-rotation'}
        >
          {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <div className="w-[1px] h-4 bg-slate-700 mx-0.5"></div>

        <button
          type="button"
          onClick={handleZoomIn}
          className="p-1.5 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          className="p-1.5 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleResetCamera}
          className="p-1.5 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
          title="Reset camera view"
          aria-label="Reset camera"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

class SafeViewerErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[250px] lg:min-h-[265px] rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-6 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-rose-400 mb-3 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-200">3D Anatomical Reference</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
            Renal 3D visualization engine standby mode.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reload 3D Engine
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const Kidney3DViewer: React.FC<Kidney3DViewerProps> = (props) => (
  <SafeViewerErrorBoundary>
    <Kidney3DViewerInner {...props} />
  </SafeViewerErrorBoundary>
);

// Preload the GLB model
try {
  useGLTF.preload('/models/human_kidney.glb');
} catch {
  // Ignore preload error during build
}
