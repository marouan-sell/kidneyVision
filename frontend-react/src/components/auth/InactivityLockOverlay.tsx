import React, { useState } from "react";
import { Lock, ShieldAlert, LogOut, KeyRound, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { apiClient } from "../../services";

interface InactivityLockOverlayProps {
  onUnlocked: () => void;
}

export default function InactivityLockOverlay({ onUnlocked }: InactivityLockOverlayProps) {
  const { user, logout } = useAuth();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || !user?.email) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.post("/auth/login", {
        email: user.email,
        password: password,
      });

      if (response.data.success && response.data.data?.token) {
        localStorage.setItem("kv_token", response.data.data.token);
        onUnlocked();
      } else {
        setError(response.data.message || "Failed to unlock session. Please check your password.");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Invalid password. Re-authentication failed.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#0d1527]/95 backdrop-blur-md flex items-center justify-center p-4 selection:bg-[#2563eb] selection:text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Clinical Workstation Inactivity Lock"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#c3c6d7]/80 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="bg-[#1e293b] text-white px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2563eb]/20 border border-[#2563eb]/40 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-[#60a5fa]" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight">Clinical Session Locked</h2>
            <p className="text-xs text-slate-400">15-Minute Inactivity Protection</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed">
              To safeguard patient health information (PHI) and clinical records against unauthorized access, your session was automatically locked after 15 minutes of inactivity.
            </p>
          </div>

          {/* Clinician Card */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold text-sm shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "DR"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {user?.name || "Attending Clinician"}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {user?.email || "clinician@hospital.org"} • {user?.hospital || "Hospital Radiology"}
              </p>
            </div>
          </div>

          {/* Unlock Form */}
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label 
                htmlFor="lock-password" 
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Enter your account password to resume
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="lock-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Account password"
                  autoFocus
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !password.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold rounded-xl shadow transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Unlock Clinical Session
                </>
              )}
            </button>
          </form>

          {/* Sign Out Option */}
          <div className="pt-2 border-t border-slate-100 flex justify-center">
            <button
              type="button"
              onClick={() => logout()}
              className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out or switch clinical account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
