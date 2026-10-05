import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { ArrowRight } from "lucide-react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "dark";
  children: ReactNode;
};

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  const variants = {
    primary: "bg-[#0f6bdc] text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] hover:bg-[#0d5fc5]",
    secondary: "border border-[#2563eb] bg-white text-[#0f56b3] hover:bg-blue-50",
    ghost: "text-[#0f3f88] hover:bg-blue-50",
    dark: "bg-[#10294f] text-white hover:bg-[#0b1e3d]",
  };
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ArrowButton({ children, ...props }: ButtonProps) {
  return (
    <Button {...props}>
      {children}
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-extrabold uppercase tracking-wide text-[#2563eb]">{children}</p>;
}

export function Card({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`rounded-lg border border-blue-200/80 bg-white/76 shadow-[0_12px_32px_rgba(23,69,133,0.05)] backdrop-blur ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[#131b2e]">{label}</span>
      <input
        className={`mt-2 w-full rounded-lg border bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-blue-100 ${
          error ? "border-red-300" : "border-[#c3c6d7]"
        }`}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
      />
      {error ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}
