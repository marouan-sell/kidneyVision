export function KidneyMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="KidneyVision AI logo">
      <defs>
        <linearGradient id="kv-renal-gradient" x1="10" y1="6" x2="54" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="65%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#0f3f88" />
        </linearGradient>
        <linearGradient id="kv-pulse-gradient" x1="16" y1="16" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="kv-inner-glow" x1="32" y1="8" x2="32" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#eff6ff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#dbeafe" stopOpacity="0.45" />
        </linearGradient>
      </defs>

      {/* Anatomical Renal Cortex Outline & Medulla Silhouette */}
      <path
        d="M32 7C20.5 7 11 15.5 9 27C7.2 37.4 12.8 48 23 53.5C28.2 56.3 34.5 56.5 39 52C43.5 47.5 42 41.5 39.5 36.5C37.5 32.5 37.5 28.5 40 24.5C43 19.5 47 16 45 11.5C43.2 7.5 37.8 7 32 7Z"
        fill="#eff6ff"
        stroke="#2563eb"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Ultrasound Acoustic Waves / Renal Calyx Conduits */}
      <path
        d="M21 21C25 17.5 31 17 36 19.5"
        stroke="#38bdf8"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M18 29C23 25.5 30 25.5 35 29"
        stroke="#38bdf8"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M19 37C23 34.5 29 35 33 39"
        stroke="#38bdf8"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* Renal Hilum & Pelvis Vascular Junction */}
      <path
        d="M38 27C34 29 32 33 34 38C35.5 41.8 39 44.5 42 48"
        stroke="#1d4ed8"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Brand({ light = false, variant }: { light?: boolean; variant?: "light" | "default" }) {
  const isLight = light || variant === "light";
  return (
    <div className="flex items-center gap-3">
      <KidneyMark className="h-10 w-10 shrink-0" />
      <div>
        <div className={`text-lg font-extrabold tracking-normal ${isLight ? "text-white" : "text-[#0f3f88]"}`}>
          KidneyVision <span className="text-[#2563eb]">AI</span>
        </div>
      </div>
    </div>
  );
}

export function KaggleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <span className={`inline-flex items-center justify-center font-bold text-sky-600 ${className}`}>k</span>;
}
