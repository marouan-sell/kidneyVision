export function KidneyMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label="KidneyVision AI logo">
      <defs>
        <linearGradient id="kidney-logo-gradient" x1="8" x2="56" y1="6" y2="58">
          <stop stopColor="#2563eb" />
          <stop offset="1" stopColor="#0f3f88" />
        </linearGradient>
      </defs>
      <path
        d="M32 8c-10 0-18 6-22 16-5 13 1 28 14 34 7 3 13 0 13-8V39c0-5 3-9 8-10l8-2c0-11-9-19-21-19Z"
        fill="#eff8ff"
        stroke="url(#kidney-logo-gradient)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.8"
      />
      <path d="M38 30c8 1 13 7 13 15v11" fill="none" stroke="#0b3a78" strokeLinecap="round" strokeWidth="3.2" />
      <path d="M38 35c-8 3-13 8-17 16M38 35c-7-1-14 1-20 6M39 34c-4-7-10-12-18-15" fill="none" stroke="#2563eb" strokeLinecap="round" strokeWidth="2.4" />
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
