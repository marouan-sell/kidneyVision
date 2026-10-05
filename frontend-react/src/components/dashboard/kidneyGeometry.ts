import * as THREE from 'three';

/**
 * Creates a high-resolution procedural diffuse texture for the renal cortex and capsule.
 * Emulates the organic, mottled deep burgundy/crimson appearance with subtle capillary networks
 * matching medical reference photography.
 */
export function createKidneyDiffuseTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Base gradient: deep rich renal crimson/burgundy
  const baseGrad = ctx.createLinearGradient(0, 0, 1024, 1024);
  baseGrad.addColorStop(0, '#5A1212'); // Deep mahogany pole
  baseGrad.addColorStop(0.3, '#7E1E1E');
  baseGrad.addColorStop(0.6, '#982727'); // Rich arterial burgundy
  baseGrad.addColorStop(0.85, '#781A1A');
  baseGrad.addColorStop(1, '#4A0E0E');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Organic parenchymal mottling (multi-octave soft cellular patches)
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const r = 15 + Math.random() * 55;
    const alpha = 0.08 + Math.random() * 0.12;

    const radGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
    const isLighter = Math.random() > 0.45;
    if (isLighter) {
      radGrad.addColorStop(0, `rgba(185, 45, 45, ${alpha})`);
      radGrad.addColorStop(1, 'rgba(120, 25, 25, 0)');
    } else {
      radGrad.addColorStop(0, `rgba(45, 8, 8, ${alpha * 1.3})`);
      radGrad.addColorStop(1, 'rgba(70, 12, 12, 0)');
    }
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Micro-capillary vascular striations across renal capsule
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(215, 65, 65, 0.15)';
  for (let i = 0; i < 45; i++) {
    let px = Math.random() * 1024;
    let py = Math.random() * 1024;
    ctx.beginPath();
    ctx.moveTo(px, py);
    for (let s = 0; s < 6; s++) {
      px += (Math.random() - 0.48) * 45;
      py += (Math.random() - 0.48) * 45;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Subtle dark lobular groove lines
  ctx.strokeStyle = 'rgba(35, 6, 6, 0.22)';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 18; i++) {
    let px = Math.random() * 1024;
    let py = Math.random() * 1024;
    ctx.beginPath();
    ctx.moveTo(px, py);
    for (let s = 0; s < 5; s++) {
      px += (Math.random() - 0.5) * 60;
      py += (Math.random() - 0.5) * 60;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates a high-resolution normal/bump texture for the organic capsule surface.
 */
export function createKidneyBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Neutral gray
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  // High-frequency cellular noise for renal capsule specularity
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 38;
    const val = Math.min(255, Math.max(0, 128 + noise));
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  // Soft low-frequency lobule bumps
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 20 + Math.random() * 40;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.14)');
    grad.addColorStop(1, 'rgba(128, 128, 128, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Procedurally generates an anatomical kidney geometry with realistic bean shape,
 * rounded convex lateral border, and medial concave hilum indentation.
 */
export function createKidneyGeometry(): THREE.BufferGeometry {
  const widthSegments = 96;
  const heightSegments = 96;
  const geometry = new THREE.SphereGeometry(1.25, widthSegments, heightSegments);
  const positionAttribute = geometry.attributes.position;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < positionAttribute.count; i++) {
    vertex.fromBufferAttribute(positionAttribute, i);

    const x = vertex.x;
    const y = vertex.y;
    const z = vertex.z;

    // Kidney dimensions: Elongated along Y, slightly compressed along Z (coronal thickness)
    let newY = y * 1.58;
    let newZ = z * 0.88;
    let newX = x;

    // Upper pole is broader and slightly more rounded than lower pole
    const normalizedY = (newY + 1.9) / 3.8; // 0 to 1
    const poleWidth = 0.94 + 0.28 * Math.sin(normalizedY * Math.PI);
    newX *= poleWidth;
    newZ *= poleWidth;

    // Asymmetric bend towards medial side (kidney bean curvature)
    const beanCurvature = 0.22 * (1.0 - Math.pow(newY / 2.1, 2));
    newX += beanCurvature;

    // Deep medial hilum notch (on the inner concave side, where x > 0 and y is near equatorial zero)
    const hilumZone = Math.exp(-Math.pow(newY * 1.25, 2)); // Strongest at mid-equator
    if (newX > 0.02) {
      // Inward indentation towards organ center
      const indent = 0.62 * hilumZone * (newX / 1.25);
      newX -= indent;

      // Anterior-posterior lip around the hilum
      const lip = 0.16 * hilumZone * Math.sin(newZ * 2.8);
      newZ += lip;
    }

    // Subtle anatomical surface lobulation (gentle organic lobes)
    const angle = Math.atan2(newZ, newX);
    const lobule = 0.025 * Math.sin(angle * 5.0) * Math.cos(newY * 3.0);
    newX += lobule * (newX / 1.2);
    newZ += lobule * (newZ / 1.2);

    vertex.set(newX, newY, newZ);
    positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Creates smooth vessel curves for:
 * - Renal Artery (main trunk + segmental branches)
 * - Renal Vein (anterior broad trunk)
 * - Renal Pelvis & Ureter (expanded funnel tapering into descending ureter)
 */
export function createVesselCurves() {
  // Main Renal Artery
  const arteryTrunk = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.08, 0.15, 0.05),
    new THREE.Vector3(0.35, 0.12, 0.12),
    new THREE.Vector3(0.75, 0.18, 0.22),
    new THREE.Vector3(1.15, 0.28, 0.35),
  ]);

  // Superior Artery Branch
  const arteryUpperBranch = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.35, 0.12, 0.12),
    new THREE.Vector3(0.55, 0.42, 0.08),
    new THREE.Vector3(0.85, 0.72, -0.05),
  ]);

  // Renal Vein (Anterior, broader caliber)
  const veinTrunk = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.05, -0.08, 0.15),
    new THREE.Vector3(0.38, -0.15, 0.28),
    new THREE.Vector3(0.82, -0.22, 0.42),
    new THREE.Vector3(1.25, -0.28, 0.55),
  ]);

  // Renal Pelvis / Ureter (Begins inside the hilum, funnels downward)
  const ureterPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.05, -0.15, -0.08),
    new THREE.Vector3(0.22, -0.55, -0.02),
    new THREE.Vector3(0.32, -1.05, 0.06),
    new THREE.Vector3(0.38, -1.65, 0.12),
    new THREE.Vector3(0.42, -2.15, 0.15),
  ]);

  return { arteryTrunk, arteryUpperBranch, veinTrunk, ureterPath };
}
