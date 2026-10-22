import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  KeyRound,
  Check,
  Copy,
  AlertCircle,
  RefreshCw,
  Lock,
  Loader2,
  X,
  Eye,
  EyeOff
} from "lucide-react";
import { apiClient } from "../../services";
import { useAuth } from "../../contexts/AuthContext";

export default function MfaSettingsSection() {
  const { user, updateUser } = useAuth();
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(Boolean(user?.mfa_enabled));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Setup modal state
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupStep, setSetupStep] = useState<"password" | "verify">("password");
  const [password, setPassword] = useState("");
  const [setupData, setSetupData] = useState<{
    secret: string;
    provisioning_uri: string;
    recovery_codes: string[];
  } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Disable modal state
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");

  useEffect(() => {
    // Fetch live status
    apiClient
      .get("/profile/mfa")
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setMfaEnabled(res.data.data.mfa_enabled);
          if (user) {
            updateUser({ ...user, mfa_enabled: res.data.data.mfa_enabled });
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleStartSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post("/profile/mfa/setup", { current_password: password });
      if (res.data?.success && res.data.data) {
        setSetupData(res.data.data);
        setSetupStep("verify");
      } else {
        setError(res.data?.message || "Failed to initiate MFA setup.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Authentication failed. Check your password.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post("/profile/mfa/confirm", { code: verifyCode });
      if (res.data?.success) {
        setMfaEnabled(true);
        if (user) {
          updateUser({ ...user, mfa_enabled: true });
        }
        setShowSetupModal(false);
        setSuccess("Two-factor authentication has been successfully activated.");
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(res.data?.message || "Invalid verification code.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) return;

    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post("/profile/mfa/disable", {
        current_password: disablePassword,
        code: disableCode || undefined,
        recovery_code: disableCode || undefined,
      });

      if (res.data?.success) {
        setMfaEnabled(false);
        if (user) {
          updateUser({ ...user, mfa_enabled: false });
        }
        setShowDisableModal(false);
        setSuccess("Two-factor authentication has been disabled.");
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(res.data?.message || "Failed to disable MFA.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Authentication failed. Check your password and code.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: "key" | "codes") => {
    navigator.clipboard.writeText(text);
    if (type === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#c3c6d7]/70 p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            mfaEnabled ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
          }`}>
            {mfaEnabled ? <ShieldCheck className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Two-Factor Authentication (MFA)</h3>
            <p className="text-xs text-slate-500">Protect clinical records with RFC 6238 time-based authenticator codes</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mfaEnabled ? (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setDisablePassword("");
                setDisableCode("");
                setShowDisableModal(true);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition cursor-pointer"
            >
              Disable 2FA
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setPassword("");
                setVerifyCode("");
                setSetupStep("password");
                setShowSetupModal(true);
              }}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-xl shadow-sm transition active:scale-[0.98] cursor-pointer"
            >
              Enable 2FA
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Status Description Banner */}
      <div className={`p-4 rounded-xl border text-xs leading-relaxed flex items-start gap-3 ${
        mfaEnabled 
          ? "bg-emerald-50/60 border-emerald-200 text-emerald-900" 
          : "bg-slate-50 border-slate-200 text-slate-600"
      }`}>
        {mfaEnabled ? (
          <>
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-950">MFA is active on your clinical account</p>
              <p className="mt-0.5 text-emerald-800">
                A 6-digit TOTP verification code from your authenticator app is required whenever signing in from a new session.
              </p>
            </div>
          </>
        ) : (
          <>
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">MFA is currently optional and disabled</p>
              <p className="mt-0.5 text-slate-600">
                We strongly recommend enabling two-factor authentication to comply with healthcare regulatory standards (HIPAA & GDPR) and safeguard patient scans.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#1e293b] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#60a5fa]" />
                <h3 className="text-sm font-bold">Configure Two-Factor Authentication</h3>
              </div>
              <button 
                onClick={() => setShowSetupModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-left">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {setupStep === "password" ? (
                <form onSubmit={handleStartSetup} className="space-y-4">
                  <p className="text-xs text-slate-600">
                    For your security, please confirm your current account password before provisioning two-factor authentication.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Current password"
                      autoFocus
                      required
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#2563eb] focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSetupModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !password}
                      className="px-4 py-2 text-xs font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-xl flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Continue to Authenticator Setup
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleConfirmSetup} className="space-y-4">
                  <p className="text-xs text-slate-600">
                    Add this account to Google Authenticator, Microsoft Authenticator, or 1Password using the secret key below:
                  </p>

                  {/* Manual Key Display */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[11px] font-semibold text-slate-500 mb-1">Secret Key (Base32):</div>
                    <div className="flex items-center justify-between font-mono text-sm tracking-wider bg-white p-2 border border-slate-200 rounded-lg">
                      <span className="select-all text-[#2563eb] font-bold">{setupData?.secret}</span>
                      <button
                        type="button"
                        onClick={() => setupData?.secret && copyToClipboard(setupData.secret, "key")}
                        className="text-xs text-slate-500 hover:text-slate-800 p-1 flex items-center gap-1 cursor-pointer"
                        title="Copy Key"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Backup Recovery Codes */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700">Backup Recovery Codes</span>
                      <button
                        type="button"
                        onClick={() => setupData?.recovery_codes && copyToClipboard(setupData.recovery_codes.join("\n"), "codes")}
                        className="text-[11px] text-[#2563eb] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCodes ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        Copy All Codes
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700">
                      {setupData?.recovery_codes?.map((code, idx) => (
                        <div key={idx} className="bg-white px-2 py-1 border border-slate-200 rounded text-center">
                          {code}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-amber-700 mt-1">
                      Store these recovery codes in a secure vault. They can be used to log in if you lose access to your device.
                    </p>
                  </div>

                  {/* Code Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Enter 6-Digit Code from Authenticator
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      autoFocus
                      required
                      className="w-full text-center tracking-widest font-mono text-lg px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#2563eb] focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSetupModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || verifyCode.length !== 6}
                      className="px-5 py-2 text-xs font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-xl flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Verify & Activate 2FA
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Disable Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-red-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h3 className="text-sm font-bold">Disable Two-Factor Authentication</h3>
              </div>
              <button 
                onClick={() => setShowDisableModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDisableMfa} className="p-6 space-y-4 text-left">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <p className="text-xs text-slate-600">
                Disabling 2FA lowers account security. Please verify your identity with your account password and either a current 6-digit TOTP code or a backup recovery code.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Password
                </label>
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Account password"
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  6-Digit Authenticator Code or Recovery Code
                </label>
                <input
                  type="text"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  placeholder="e.g. 123456 or ABCD-1234-EF"
                  required
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisableModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !disablePassword || !disableCode}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm & Disable 2FA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
