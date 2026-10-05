import React, { useState } from "react";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { sendPasswordResetLink } from "../services";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await sendPasswordResetLink(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fcfcff] min-h-screen flex items-center justify-center py-12 px-6 font-sans">
      <div className="w-full max-w-md">
        <a href="/login" className="inline-flex items-center gap-2 text-sm text-[#434655] hover:text-[#2563eb] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </a>

        <div className="bg-white border border-[#c3c6d7] rounded-xl p-8 shadow-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-[#131b2e] mb-2">Reset Password</h1>
            <p className="text-[#434655] text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {success ? (
            <div className="animate-[fadeIn_300ms_ease-out] text-center py-6 space-y-4">
              <div className="mx-auto w-12 h-12 bg-[#eaedff] rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-[#2563eb]" />
              </div>
              <h3 className="text-lg font-bold text-[#131b2e]">Reset Link Dispatched</h3>
              <p className="text-sm text-[#434655]">
                We've sent a password reset verification link to <span className="font-semibold">{email}</span>. Please check your clinical inbox to create your new password.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#131b2e] mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#fcfcff] border border-[#c3c6d7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
                  placeholder="doctor@hospital.com"
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
                disabled={loading || !email}
                className="w-full bg-[#2563eb] hover:bg-[#004ac6] text-white font-semibold py-2.5 rounded-lg flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Sending link..." : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
