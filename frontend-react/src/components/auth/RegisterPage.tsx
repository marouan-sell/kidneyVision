import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Brand } from "../common/Brand";
import { useAuth } from "../../contexts/AuthContext";
import { registerUser } from "../../services";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [fullName, setFullName] = useState("");
  const [hospital, setHospital] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !hospital || !email || !password || !passwordConfirmation) {
      setError("Fill in every field to request clinical access.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Passwords don't match. Re-enter them to continue.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await registerUser(
        email,
        fullName,
        hospital,
        password,
        passwordConfirmation
      );
      login(response.token, response.user);
      navigate("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "We couldn't create your account. Check your details and try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white font-sans text-[#131b2e] flex">
      {/* Left: clinical visual panel */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-[#10294f]">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full blur-3xl opacity-30"
          style={{
            background:
              "radial-gradient(circle, #0f6bdc 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-180px] left-[-100px] h-[420px] w-[420px] rounded-full blur-3xl opacity-25"
          style={{
            background:
              "radial-gradient(circle, #2563eb 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="inline-flex w-fit">
            <Brand variant="light" />
          </Link>

          <div className="max-w-sm">
            <p className="text-blue-200/90 text-sm tracking-tight mb-3">
              Specialist onboarding
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-white leading-[1.15]">
              Built for the specialists who read the scans.
            </h2>
            <p className="mt-3 text-blue-200/80 text-[15px] leading-relaxed">
              Request an authorized account to upload, analyze, and track
              renal ultrasound studies with AI-assisted stone detection.
            </p>

            <div className="mt-8 space-y-3">
              <ChecklistRow text="Verified against your hospital credentials" />
              <ChecklistRow text="Full study history and export tools" />
              <ChecklistRow text="Encrypted storage, HIPAA / GDPR aligned" />
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
        <div className="w-full max-w-[440px]">
          <div className="md:hidden mb-8">
            <Link to="/">
              <Brand />
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-[28px] font-bold tracking-tight text-[#131b2e]">
              Request Clinical Access
            </h1>
            <p className="mt-2 text-[15px] text-[#737686]">
              Create your authorized specialist account to analyze scans.
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
                htmlFor="fullName"
                className="mb-1.5 block text-[13px] font-medium text-[#434655]"
              >
                Full name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8b8ea0]" />
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Sarah Chen, M.D."
                  className="w-full rounded-xl border border-[#c3c6d7] bg-[#f8faff] py-3 pl-11 pr-4 text-[15px] text-[#131b2e] placeholder:text-[#9a9dab] transition focus:border-[#2563eb] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="hospital"
                className="mb-1.5 block text-[13px] font-medium text-[#434655]"
              >
                Hospital / organization
              </label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8b8ea0]" />
                <input
                  id="hospital"
                  type="text"
                  autoComplete="organization"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  placeholder="St. Jude Medical Center"
                  className="w-full rounded-xl border border-[#c3c6d7] bg-[#f8faff] py-3 pl-11 pr-4 text-[15px] text-[#131b2e] placeholder:text-[#9a9dab] transition focus:border-[#2563eb] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

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
                  placeholder="s.chen@hospital.org"
                  className="w-full rounded-xl border border-[#c3c6d7] bg-[#f8faff] py-3 pl-11 pr-4 text-[15px] text-[#131b2e] placeholder:text-[#9a9dab] transition focus:border-[#2563eb] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-[13px] font-medium text-[#434655]"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8b8ea0]" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
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

              <div>
                <label
                  htmlFor="passwordConfirmation"
                  className="mb-1.5 block text-[13px] font-medium text-[#434655]"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8b8ea0]" />
                  <input
                    id="passwordConfirmation"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[#c3c6d7] bg-[#f8faff] py-3 pl-11 pr-11 text-[15px] text-[#131b2e] placeholder:text-[#9a9dab] transition focus:border-[#2563eb] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8b8ea0] hover:text-[#434655]"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-[18px] w-[18px]" />
                    ) : (
                      <Eye className="h-[18px] w-[18px]" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[12.5px] leading-relaxed text-[#737686]">
              By registering, you agree to our{" "}
              <Link
                to="/terms"
                className="font-medium text-[#2563eb] hover:text-[#0d5fc5]"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                className="font-medium text-[#2563eb] hover:text-[#0d5fc5]"
              >
                Privacy Policy
              </Link>
              .
            </p>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_32px_rgba(23,69,133,0.18)] transition hover:bg-[#0d5fc5] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-[18px] w-[18px] animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Specialist Account
                  <ArrowRight className="h-[18px] w-[18px]" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[14px] text-[#737686]">
            Already authorized?{" "}
            <Link
              to="/login"
              className="font-semibold text-[#2563eb] hover:text-[#0d5fc5]"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function ChecklistRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-blue-300" />
      <p className="text-[14px] text-blue-100/90">{text}</p>
    </div>
  );
}
