import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { resetPassword } from "../services";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Extract token and email from URL parameters
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    const urlEmail = params.get("email");

    if (urlToken) setToken(urlToken);
    if (urlEmail) setEmail(urlEmail);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !email) {
      setError("Invalid reset link. Missing token or email.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await resetPassword({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. The link might be expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fcfcff] min-h-screen flex items-center justify-center py-12 px-6 font-sans">
      <div className="w-full max-w-md">
        <div className="bg-white border border-[#c3c6d7] rounded-xl p-8 shadow-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-[#131b2e] mb-2">Create New Password</h1>
            <p className="text-[#434655] text-sm">
              Please enter your new password below.
            </p>
          </div>

          {success ? (
            <div className="animate-[fadeIn_300ms_ease-out] text-center py-6 space-y-6">
              <div className="mx-auto w-12 h-12 bg-[#eaedff] rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-[#2563eb]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#131b2e]">Password Reset Successful</h3>
                <p className="text-sm text-[#434655] mt-2">
                  Your password has been successfully updated. You can now log in with your new password.
                </p>
              </div>
              <a 
                href="/login"
                className="w-full bg-[#2563eb] hover:bg-[#004ac6] text-white font-semibold py-2.5 rounded-lg flex justify-center items-center transition-colors inline-flex"
              >
                Go to Login
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#131b2e] mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2.5 bg-[#f2f3ff] border border-[#c3c6d7] rounded-lg text-[#737686] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#131b2e] mb-1.5">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#fcfcff] border border-[#c3c6d7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#131b2e] mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#fcfcff] border border-[#c3c6d7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 font-medium p-3 bg-red-50 border border-red-100 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password || !passwordConfirmation}
                className="w-full bg-[#2563eb] hover:bg-[#004ac6] text-white font-semibold py-2.5 rounded-lg flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
