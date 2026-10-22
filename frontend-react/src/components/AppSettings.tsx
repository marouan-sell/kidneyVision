/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Sliders,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Activity,
  Layers,
  Save,
  Info,
  Camera,
  Trash2,
  PenTool,
  Check,
  X,
  FileCheck,
  Database,
  Cpu
} from "lucide-react";
import {
  fetchSettings,
  saveSettings,
  fetchSystemHealth,
  fetchUserProfile,
  saveUserProfile,
  uploadAvatar,
  deleteAvatar,
  saveSignature,
  deleteSignature,
} from "../services";
import { AppSettings as IAppSettings, SystemHealth, UserProfile } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import MfaSettingsSection from "./settings/MfaSettingsSection";

type SettingsSection = "clinical" | "profile";



export default function AppSettings() {
  const { user: authUser, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSection = (searchParams.get("tab") as SettingsSection) === "profile" ? "profile" : "clinical";
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "profile") {
      setActiveSection("profile");
    } else if (tab === "clinical") {
      setActiveSection("clinical");
    }
  }, [searchParams]);

  const handleTabChange = (section: SettingsSection) => {
    setActiveSection(section);
    setSearchParams({ tab: section });
  };

  // ──────────────────────────────────────────
  // AI & Clinical State
  // ──────────────────────────────────────────
  const [settings, setSettings] = useState<IAppSettings>({
    ai_confidence_threshold: 85,
    alert_kidney_stone: true,
    alert_low_confidence: true,
    alert_system_errors: true,
    demo_mode: false,
    audit_logging_enabled: true,
    session_timeout_minutes: 30,
    auto_logout_enabled: true,
    data_retention_days: 365,
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // System Health (Genuine AI status)
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // ──────────────────────────────────────────
  // Radiologist Profile State
  // ──────────────────────────────────────────
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Profile Picture Upload State
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // Signature Canvas State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [signatureHasDrawn, setSignatureHasDrawn] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureSaving, setSignatureSaving] = useState(false);

  // Initial Data Load
  useEffect(() => {
    loadSettings();
    loadHealth();
    loadProfile();
  }, []);

  async function loadSettings() {
    setSettingsLoading(true);
    try {
      const data = await fetchSettings();
      setSettings(data);
    } catch {
      setSettingsError("Failed to retrieve settings from server.");
    } finally {
      setSettingsLoading(false);
    }
  }

  async function loadHealth() {
    setHealthLoading(true);
    try {
      const data = await fetchSystemHealth();
      setHealth(data);
    } catch {
      // Health check failure
    } finally {
      setHealthLoading(false);
    }
  }

  async function loadProfile() {
    setProfileLoading(true);
    try {
      const data = await fetchUserProfile();
      setProfile(data);
    } catch {
      if (authUser) {
        setProfile({
          id: authUser.id || 1,
          name: authUser.name,
          email: authUser.email,
          role: authUser.role || "Radiologist",
          hospital: authUser.hospital || "Not specified",
          avatar_url: authUser.avatarUrl || authUser.avatar_url || null,
          signature_configured: Boolean(authUser.signature_configured),
          signature_url: authUser.signature_url || null,
          is_admin: false,
        });
      }
    } finally {
      setProfileLoading(false);
    }
  }

  // ──────────────────────────────────────────
  // Save AI & Clinical Settings
  // ──────────────────────────────────────────
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsSuccess(null);
    setSettingsError(null);

    try {
      const updated = await saveSettings({
        ai_confidence_threshold: settings.ai_confidence_threshold,
        alert_kidney_stone: settings.alert_kidney_stone,
        alert_low_confidence: settings.alert_low_confidence,
        alert_system_errors: settings.alert_system_errors,
      });
      setSettings(updated);
      setSettingsSuccess("Clinical preferences and AI review thresholds successfully persisted.");
      setTimeout(() => setSettingsSuccess(null), 4000);
    } catch (err: any) {
      setSettingsError(err.message || "Failed to persist clinical preferences.");
    } finally {
      setSettingsSaving(false);
    }
  }

  // ──────────────────────────────────────────
  // Save Profile Details
  // ──────────────────────────────────────────
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setProfileSaving(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const updated = await saveUserProfile({
        name: profile.name,
        hospital: profile.hospital,
        role: profile.role,
      });
      setProfile((prev) => (prev ? { ...prev, ...updated } : null));
      if (authUser) {
        updateUser({
          ...authUser,
          name: updated.name,
          hospital: updated.hospital,
          role: updated.role,
        });
      }
      setProfileSuccess("Radiologist profile updated successfully.");
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  // ──────────────────────────────────────────
  // Avatar Upload / Removal
  // ──────────────────────────────────────────
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setProfileError("Profile picture must be a JPG, PNG, or WebP image.");
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfileError("Profile picture cannot exceed 2MB in file size.");
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      return;
    }

    setAvatarUploading(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const avatarUrl = await uploadAvatar(file);
      setProfile((prev) => (prev ? { ...prev, avatar_url: avatarUrl } : null));
      if (authUser) {
        updateUser({ ...authUser, avatarUrl, avatar_url: avatarUrl });
      }
      setProfileSuccess("Profile picture uploaded and updated successfully.");
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      setProfileError(err.message || "Failed to upload profile picture.");
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    if (!window.confirm("Remove your profile picture and restore default initials?")) return;
    setAvatarUploading(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      await deleteAvatar();
      setProfile((prev) => (prev ? { ...prev, avatar_url: null } : null));
      if (authUser) {
        updateUser({ ...authUser, avatarUrl: null, avatar_url: null });
      }
      setProfileSuccess("Profile picture removed.");
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      setProfileError(err.message || "Failed to remove profile picture.");
    } finally {
      setAvatarUploading(false);
    }
  };

  // ──────────────────────────────────────────
  // Signature Drawing Canvas Handlers
  // ──────────────────────────────────────────
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1e3a8a"; // Clinical deep navy signature ink
    ctx.beginPath();
    ctx.moveTo(x, y);

    setIsDrawingSignature(true);
    setSignatureHasDrawn(true);
  };

  const drawSignature = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingSignature) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingSignature) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.closePath();
    }
    setIsDrawingSignature(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureHasDrawn(false);
  };

  const handleSaveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !signatureHasDrawn) {
      setProfileError("Please draw your signature on the pad before saving.");
      return;
    }

    setSignatureSaving(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const res = await saveSignature(dataUrl);

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              signature_configured: true,
              signature_url: res.signature_url,
              signature_updated_at: res.signature_updated_at,
            }
          : null
      );

      if (authUser) {
        updateUser({
          ...authUser,
          signature_configured: true,
          signature_url: res.signature_url,
        });
      }

      setShowSignaturePad(false);
      setProfileSuccess("Electronic signature successfully configured and attached to PDF reports.");
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      setProfileError(err.message || "Failed to save digital signature.");
    } finally {
      setSignatureSaving(false);
    }
  };

  const handleRemoveSignature = async () => {
    if (!window.confirm("Are you sure you want to remove your configured signature? Generated PDF reports will no longer show your digital attestation.")) {
      return;
    }

    setSignatureSaving(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      await deleteSignature();
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              signature_configured: false,
              signature_url: null,
              signature_updated_at: undefined,
            }
          : null
      );

      if (authUser) {
        updateUser({
          ...authUser,
          signature_configured: false,
          signature_url: null,
        });
      }

      setShowSignaturePad(false);
      clearCanvas();
      setProfileSuccess("Configured signature removed successfully.");
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      setProfileError(err.message || "Failed to remove signature.");
    } finally {
      setSignatureSaving(false);
    }
  };

  // Helper for clinician initials
  const clinicianInitials = profile?.name
    ? profile.name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "DR";

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-5">
        <div>
          <h2 className="font-sans text-2xl font-bold text-[#131b2e] tracking-tight">
            Clinical System Settings
          </h2>
          <p className="font-sans text-xs text-[#52576b] mt-1">
            Configure real-time neural inference parameters, clinical preferences, and attending radiologist credentials.
          </p>
        </div>
      </div>

      {/* Two Clean Sections Navigation */}
      <div className="flex items-center gap-2 border-b border-[#e2e8f0] pb-px">
        <button
          type="button"
          onClick={() => handleTabChange("clinical")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
            activeSection === "clinical"
              ? "border-[#2563eb] text-[#2563eb] bg-[#eff4fe]"
              : "border-transparent text-[#64748b] hover:text-[#131b2e] hover:bg-[#f8fafc]"
          }`}
        >
          <Sliders className={`w-4 h-4 ${activeSection === "clinical" ? "text-[#2563eb]" : "text-[#94a3b8]"}`} />
          AI & Clinical
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("profile")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
            activeSection === "profile"
              ? "border-[#2563eb] text-[#2563eb] bg-[#eff4fe]"
              : "border-transparent text-[#64748b] hover:text-[#131b2e] hover:bg-[#f8fafc]"
          }`}
        >
          <UserIcon className={`w-4 h-4 ${activeSection === "profile" ? "text-[#2563eb]" : "text-[#94a3b8]"}`} />
          Radiologist Profile
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* SECTION 1: AI & Clinical */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeSection === "clinical" && (
        <div className="space-y-6">
          {settingsSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{settingsSuccess}</span>
            </div>
          )}
          {settingsError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{settingsError}</span>
            </div>
          )}

          {/* Genuine AI Service & Deep Learning Model Status Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#434655] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-400 stroke-[1.75]" />
                Genuine AI Microservice Status
              </h3>
              <button
                type="button"
                onClick={loadHealth}
                disabled={healthLoading}
                className="text-[11px] font-semibold text-[#2563eb] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${healthLoading ? "animate-spin" : ""}`} />
                Refresh Telemetry
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: AI / Flask Engine */}
              <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#131b2e] flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-slate-400 stroke-[1.75]" />
                    AI Flask Microservice
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      health?.services.ai_service.status === "connected"
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : "text-amber-700 bg-amber-50 border-amber-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        health?.services.ai_service.status === "connected"
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-amber-500"
                      }`}
                    />
                    {health?.services.ai_service.status === "connected" ? "Connected" : "Standby"}
                  </span>
                </div>
                <div className="text-[11px] text-[#64748b] space-y-0.5 font-mono">
                  <div>Endpoint: <span className="text-[#1e293b]">http://127.0.0.1:5000</span></div>
                  <div>Health: <span className="text-[#1e293b]">/health</span></div>
                </div>
              </div>

              {/* Card 2: Deep Neural Network Architecture */}
              <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#131b2e] flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-slate-400 stroke-[1.75]" />
                    ConvNeXt 4-Class Model
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      health?.services.ai_service.model_status === "loaded"
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : "text-emerald-700 bg-emerald-50 border-emerald-200"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Operational
                  </span>
                </div>
                <div className="text-[11px] text-[#64748b] space-y-0.5">
                  <div>Classes: <span className="font-semibold text-[#1e293b]">Cyst, Normal, Stone, Tumor</span></div>
                  <div>Gatekeeper: <span className="font-semibold text-[#1e293b]">MobileNetV3-Small</span></div>
                </div>
              </div>

              {/* Card 3: Relational Medical Database */}
              <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#131b2e] flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-slate-400 stroke-[1.75]" />
                    Clinical Database
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      health?.services.database.status === "connected"
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : "text-red-700 bg-red-50 border-red-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        health?.services.database.status === "connected" ? "bg-emerald-500" : "bg-red-500"
                      }`}
                    />
                    {health?.services.database.status === "connected" ? "Connected" : "Offline"}
                  </span>
                </div>
                <div className="text-[11px] text-[#64748b] space-y-0.5">
                  <div>Driver: <span className="font-mono text-[#1e293b] uppercase">{health?.services.database.driver || "PGSQL"}</span></div>
                  <div>Audit Trail: <span className="text-[#1e293b] font-semibold">Active Ledger</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Form for Supported Clinical Preferences */}
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: AI Confidence Threshold */}
              <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-slate-400 stroke-[1.75]" />
                    AI Review & Triage Threshold
                  </h3>
                  <span className="px-3 py-1 bg-[#eff4fe] text-[#2563eb] font-bold text-xs rounded-full border border-[#2563eb]/20 font-mono">
                    {settings.ai_confidence_threshold}%
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-[#131b2e]">Application Decision Boundary</span>
                    <span className="text-[11px] text-[#64748b]">Selected: {settings.ai_confidence_threshold}%</span>
                  </div>

                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="1"
                    value={settings.ai_confidence_threshold}
                    onChange={(e) =>
                      setSettings({ ...settings, ai_confidence_threshold: Number(e.target.value) })
                    }
                    className="w-full accent-[#2563eb] cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                  />

                  <div className="flex justify-between text-[10px] text-[#64748b] font-mono">
                    <span>50% (Permissive)</span>
                    <span>75% (Standard)</span>
                    <span>95% (Strict Review)</span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[11px] text-[#475569] leading-relaxed flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#2563eb] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#1e293b]">Clinical Triage Rule:</strong> Inferences with predictive confidence ≥ <span className="font-bold text-[#2563eb]">{settings.ai_confidence_threshold}%</span> are marked as primary assessments. Scans below this boundary trigger mandatory radiologist review.
                  </div>
                </div>
              </div>

              {/* Card 2: Clinical Alert Routing */}
              <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-2 pb-3 border-b border-[#e2e8f0]">
                  <Sliders className="w-4 h-4 text-slate-400 stroke-[1.75]" />
                  Supported Clinical Notifications
                </h3>

                <div className="space-y-3">
                  {/* Kidney Stone Alert Toggle */}
                  <div className="flex items-start justify-between p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
                    <div className="space-y-0.5 pr-3">
                      <label htmlFor="alert_ks" className="text-xs font-semibold text-[#131b2e] cursor-pointer block">
                        Kidney Stone Urgent Alerts
                      </label>
                      <span className="text-[11px] text-[#64748b] block">
                        Highlight detected calculus cases with elevated risk badge for prompt intervention.
                      </span>
                    </div>
                    <input
                      id="alert_ks"
                      type="checkbox"
                      checked={settings.alert_kidney_stone}
                      onChange={(e) => setSettings({ ...settings, alert_kidney_stone: e.target.checked })}
                      className="w-4 h-4 text-[#2563eb] border-[#c3c6d7] rounded focus:ring-[#2563eb] mt-1 cursor-pointer"
                    />
                  </div>

                  {/* Low Confidence Queue Toggle */}
                  <div className="flex items-start justify-between p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
                    <div className="space-y-0.5 pr-3">
                      <label htmlFor="alert_lc" className="text-xs font-semibold text-[#131b2e] cursor-pointer block">
                        Review Queue Routing
                      </label>
                      <span className="text-[11px] text-[#64748b] block">
                        Automatically tag borderline scans for secondary clinician verification.
                      </span>
                    </div>
                    <input
                      id="alert_lc"
                      type="checkbox"
                      checked={settings.alert_low_confidence}
                      onChange={(e) => setSettings({ ...settings, alert_low_confidence: e.target.checked })}
                      className="w-4 h-4 text-[#2563eb] border-[#c3c6d7] rounded focus:ring-[#2563eb] mt-1 cursor-pointer"
                    />
                  </div>

                  {/* System Connectivity Alert Toggle */}
                  <div className="flex items-start justify-between p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
                    <div className="space-y-0.5 pr-3">
                      <label htmlFor="alert_se" className="text-xs font-semibold text-[#131b2e] cursor-pointer block">
                        Service Degraded Notifications
                      </label>
                      <span className="text-[11px] text-[#64748b] block">
                        Notify attending doctor if neural server connectivity or preprocessing fails.
                      </span>
                    </div>
                    <input
                      id="alert_se"
                      type="checkbox"
                      checked={settings.alert_system_errors}
                      onChange={(e) => setSettings({ ...settings, alert_system_errors: e.target.checked })}
                      className="w-4 h-4 text-[#2563eb] border-[#c3c6d7] rounded focus:ring-[#2563eb] mt-1 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={settingsSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {settingsSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save AI & Clinical Settings</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* SECTION 2: Radiologist Profile */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeSection === "profile" && (
        <div className="space-y-6">
          {profileSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}
          {profileError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {/* Card A: Profile Picture & Identity */}
          <div className="bg-white border border-[#c3c6d7] rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-2 pb-4 border-b border-[#e2e8f0]">
              <Camera className="w-4 h-4 text-[#2563eb]" />
              Clinician Avatar & Identification
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-5">
              {/* Avatar Preview */}
              <div className="relative group shrink-0">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name}
                    className="w-24 h-24 rounded-full object-cover border-2 border-[#2563eb] shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[#eff4fe] border-2 border-[#c3c6d7] text-[#2563eb] flex items-center justify-center font-extrabold text-2xl shadow-inner">
                    {clinicianInitials}
                  </div>
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 bg-slate-900/60 rounded-full flex items-center justify-center text-white">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload & Replacement Controls */}
              <div className="space-y-2 text-center sm:text-left flex-1">
                <h4 className="text-sm font-bold text-[#131b2e]">
                  {profile?.name || "Attending Radiologist"}
                </h4>
                <p className="text-xs text-[#64748b]">
                  Supported formats: JPG, PNG, WebP (maximum 2MB). Used across the portal, session credentials, and audit headers.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-2 justify-center sm:justify-start">
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarFileSelect}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Upload New Photo</span>
                  </button>

                  {profile?.avatar_url && (
                    <button
                      type="button"
                      onClick={handleAvatarRemove}
                      disabled={avatarUploading}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-200 text-xs font-semibold rounded-lg transition disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Photo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card B: Supported Clinician Profile Form */}
          <form onSubmit={handleSaveProfile} className="bg-white border border-[#c3c6d7] rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-2 pb-4 border-b border-[#e2e8f0]">
              <UserIcon className="w-4 h-4 text-[#2563eb]" />
              Physician Credentials & Facility
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#131b2e]" htmlFor="doc-name">
                  Clinician Full Name
                </label>
                <input
                  id="doc-name"
                  type="text"
                  value={profile?.name || ""}
                  onChange={(e) => setProfile(profile ? { ...profile, name: e.target.value } : null)}
                  className="w-full px-3 py-2 text-xs border border-[#c3c6d7] rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                  placeholder="e.g. Dr. Marouan Sellami, MD"
                  required
                />
              </div>

              {/* Email (Readonly Identifier) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#131b2e]">
                  Account Email (Authenticated Identity)
                </label>
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-100 text-slate-500 rounded-lg cursor-not-allowed font-mono"
                />
              </div>

              {/* Clinical Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#131b2e]" htmlFor="doc-role">
                  Specialty / Department Role
                </label>
                <input
                  id="doc-role"
                  type="text"
                  value={profile?.role || ""}
                  onChange={(e) => setProfile(profile ? { ...profile, role: e.target.value } : null)}
                  className="w-full px-3 py-2 text-xs border border-[#c3c6d7] rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                  placeholder="e.g. Attending Radiologist / Nephrology"
                />
              </div>

              {/* Medical Facility */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#131b2e]" htmlFor="doc-hospital">
                  Medical Center / Hospital Institution
                </label>
                <input
                  id="doc-hospital"
                  type="text"
                  value={profile?.hospital || ""}
                  onChange={(e) => setProfile(profile ? { ...profile, hospital: e.target.value } : null)}
                  className="w-full px-3 py-2 text-xs border border-[#c3c6d7] rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                  placeholder="e.g. University Teaching Hospital"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={profileSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {profileSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Profile Credentials</span>
              </button>
            </div>
          </form>

          {/* Card C: Functional Configure Signature Section */}
          <div className="bg-white border border-[#c3c6d7] rounded-xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e2e8f0]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-[#2563eb]" />
                  Attending Radiologist Digital Signature
                </h3>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Draw and persist your authorized medical signature for integration into official PDF diagnostic reports.
                </p>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-auto ${
                  profile?.signature_configured
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : "bg-amber-50 text-amber-800 border-amber-300"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${profile?.signature_configured ? "bg-emerald-500" : "bg-amber-500"}`} />
                {profile?.signature_configured ? "Active & Configured" : "Not Configured"}
              </span>
            </div>

            {/* Current Configured Signature Display */}
            {profile?.signature_configured && profile.signature_url && !showSignaturePad && (
              <div className="p-5 bg-[#f8fafc] border border-slate-200 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-xs font-bold text-slate-800 block">
                      Active Authorized Signature
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Embedded in all generated diagnostic dossiers under Certification.
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs flex items-center justify-center min-w-[200px]">
                    <img
                      src={profile.signature_url}
                      alt="Configured Radiologist Signature"
                      className="max-h-14 max-w-[220px] object-contain"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSignaturePad(true);
                      setTimeout(clearCanvas, 50);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-[#2563eb] border border-[#2563eb] rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Update Signature</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveSignature}
                    disabled={signatureSaving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Signature</span>
                  </button>
                </div>
              </div>
            )}

            {/* If Not Configured, Prompt CTA */}
            {!profile?.signature_configured && !showSignaturePad && (
              <div className="p-6 bg-amber-50/60 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5 justify-center sm:justify-start">
                    <FileCheck className="w-4 h-4 text-amber-600" />
                    Signature Attestation Pending
                  </h4>
                  <p className="text-xs text-amber-900/90 leading-relaxed">
                    Configure your digitized medical signature so exported PDF diagnostic dossiers include certified radiologist verification.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSignaturePad(true)}
                  className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-sm transition whitespace-nowrap cursor-pointer shrink-0"
                >
                  Configure Signature
                </button>
              </div>
            )}

            {/* Interactive Drawing Pad Modal / Box */}
            {showSignaturePad && (
              <div className="p-5 bg-slate-50 border border-slate-300 rounded-xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <PenTool className="w-4 h-4 text-[#2563eb]" />
                      Sign in the Box Below
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Use your mouse, trackpad, or touchscreen stylus to draw your medical signature.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSignaturePad(false);
                      clearCanvas();
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Drawing Surface */}
                <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden shadow-inner flex justify-center">
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={drawSignature}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={drawSignature}
                    onTouchEnd={stopDrawing}
                    className="cursor-crosshair touch-none w-full max-w-[560px] h-[160px]"
                  />
                  {!signatureHasDrawn && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 text-xs font-medium">
                      Draw clinician signature here
                    </div>
                  )}
                </div>

                {/* Pad Controls */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    Clear Canvas
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSignaturePad(false)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSignature}
                      disabled={signatureSaving || !signatureHasDrawn}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg text-xs font-bold transition disabled:opacity-40 cursor-pointer shadow-sm"
                    >
                      {signatureSaving ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Save Signature</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Clinician Account Security & Two-Factor Authentication */}
          <MfaSettingsSection />
        </div>
      )}

    </div>
  );
}
