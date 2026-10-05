import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { Brand } from "../common/Brand";
import { useAuth } from "../../contexts/AuthContext";
import { loginUser } from "../../services";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState(() => localStorage.getItem("kv_remember_email") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(() => Boolean(localStorage.getItem("kv_remember_email")));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Enter your clinical email and password to continue.");
      return;
    }

    if (rememberDevice) {
      localStorage.setItem("kv_remember_email", email.trim());
    } else {
      localStorage.removeItem("kv_remember_email");
    }

    setIsLoading(true);
    try {
      const response = await loginUser(email.trim(), password);
      login(response.token, response.user);
      navigate("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "We couldn't verify those credentials. Check them and try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white font-sans text-[#131b2e] flex">
      {/* Left: clinical visual panel */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-[#0f3f88]">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl opacity-30"
          style={{
            background:
              "radial-gradient(circle, #2563eb 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-160px] right-[-120px] h-[420px] w-[420px] rounded-full blur-3xl opacity-25"
          style={{
            background:
              "radial-gradient(circle, #0f6bdc 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="inline-flex w-fit">
            <Brand variant="light" />
          </Link>

          <div className="max-w-sm">
            <h2 className="text-3xl font-bold tracking-tight text-white leading-[1.15]">
              Clinical-grade precision, read in seconds.
            </h2>
            <p className="mt-3 text-blue-200/80 text-[15px] leading-relaxed">
              KidneyVision AI supports specialists with instant, AI-assisted
              triage of renal ultrasound imaging.
            </p>

            <div className="mt-8 space-y-4">
              <FeatureRow
                title="Clinical-Grade Precision"
                detail="Trained and validated against radiologist-reviewed scans."
              />
              <FeatureRow
                title="Instant Renal Triage"
                detail="Stone likelihood scoring returned in under a second."
              />
              <FeatureRow
                title="HIPAA / GDPR Security"
                detail="Encrypted in transit and at rest, every session."
              />
            </div>
          </div>

          <p className="text-blue-300/60 text-xs">
            © {new Date().getFullYear()} KidneyVision AI. For licensed
            clinical use only.
          </p>
        </div>
      </div>

      {/* Right: auth card */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-[420px]">
          <div className="md:hidden mb-8">
            <Link to="/">
              <Brand />
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-[28px] font-bold tracking-tight text-[#131b2e]">
              Welcome Back
            </h1>
            <p className="mt-2 text-[15px] text-[#737686]">
              Sign in to access your clinical diagnostics portal.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
              <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-[13px] font-medium text-[#434655]"
              >
                Clinical email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8b8ea0]" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dr.smith@hospital.org"
                  className="w-full rounded-xl border border-[#c3c6d7] bg-[#f8faff] py-3 pl-11 pr-4 text-[15px] text-[#131b2e] placeholder:text-[#9a9dab] transition focus:border-[#2563eb] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-[13px] font-medium text-[#434655]"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[13px] font-medium text-[#2563eb] hover:text-[#0d5fc5]"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8b8ea0]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#c3c6d7] bg-[#f8faff] py-3 pl-11 pr-11 text-[15px] text-[#131b2e] placeholder:text-[#9a9dab] transition focus:border-[#2563eb] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8b8ea0] hover:text-[#434655]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[#434655]">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="h-4 w-4 rounded border-[#c3c6d7] text-[#2563eb] focus:ring-2 focus:ring-blue-100"
              />
              Remember this workstation
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_32px_rgba(23,69,133,0.18)] transition hover:bg-[#0d5fc5] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-[18px] w-[18px] animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock className="h-[18px] w-[18px]" />
                  Sign In
                  <ArrowRight className="h-[18px] w-[18px]" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[14px] text-[#737686]">
            Don't have clinical access?{" "}
            <Link
              to="/register"
              className="font-semibold text-[#2563eb] hover:text-[#0d5fc5]"
            >
              Request Access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-300" />
      <div>
        <p className="text-[14px] font-semibold text-white">{title}</p>
        <p className="text-[13px] text-blue-200/70 leading-snug">{detail}</p>
      </div>
    </div>
  );
}


