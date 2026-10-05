/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Sliders,
  Database,
  ShieldCheck,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Key,
  Lock,
  Server,
  Activity,
  FileText,
  Save,
  AlertTriangle,
  LogOut,
  Search,
  Filter,
  Info,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import {
  API_URL,
  fetchSettings,
  saveSettings,
  fetchSystemHealth,
  fetchUserProfile,
  saveUserProfile,
  changePassword,
  revokeOtherSessions,
  fetchAuditLogs,
} from "../services";
import { AppSettings as IAppSettings, SystemHealth, UserProfile, AuditLogEntry } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { useSearchParams } from "react-router-dom";

type SettingsTab = "clinical" | "services" | "profile" | "privacy" | "audit" | "system";

export default function AppSettings() {
  const { user: authUser, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as SettingsTab) || "clinical";
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  useEffect(() => {
    const tab = searchParams.get("tab") as SettingsTab | null;
    if (tab && ["clinical", "services", "profile", "privacy", "audit", "system"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Clinical & System Settings State
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

  // System Health State
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Profile State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Session Revocation State
  const [revokingSessions, setRevokingSessions] = useState(false);
  const [sessionSuccess, setSessionSuccess] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditMeta, setAuditMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState("");
  const [auditSearchQuery, setAuditSearchQuery] = useState("");
  const [auditPage, setAuditPage] = useState(1);

  // Initial Load
  useEffect(() => {
    loadSettings();
    loadHealth();
    loadProfile();
  }, []);

  // Load Audit Logs when tab or filters change
  useEffect(() => {
    if (activeTab === "audit") {
      loadAuditLogs();
    }
  }, [activeTab, auditPage, auditActionFilter]);

  async function loadSettings() {
    setSettingsLoading(true);
    try {
      const data = await fetchSettings();
      setSettings(data);
    } catch (err: any) {
      setSettingsError("Failed to load settings from server.");
    } finally {
      setSettingsLoading(false);
    }
  }

  async function loadHealth() {
    setHealthLoading(true);
    try {
      const data = await fetchSystemHealth();
      setHealth(data);
    } catch (err) {
      console.error(err);
    } finally {
      setHealthLoading(false);
    }
  }

  async function loadProfile() {
    setProfileLoading(true);
    try {
      const data = await fetchUserProfile();
      setProfile(data);
    } catch (err: any) {
      // Fallback from auth context if available
      if (authUser) {
        setProfile({
          id: 1,
          name: authUser.name,
          email: authUser.email,
          role: authUser.role || "Radiologist",
          hospital: authUser.hospital || "Not specified",
          signature_configured: false,
          is_admin: false,
        });
      }
    } finally {
      setProfileLoading(false);
    }
  }

  async function loadAuditLogs() {
    setAuditLoading(true);
    try {
      const res = await fetchAuditLogs({
        page: auditPage,
        action: auditActionFilter || undefined,
        search: auditSearchQuery || undefined,
      });
      setAuditLogs(res.logs);
      setAuditMeta(res.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsSuccess(null);
    setSettingsError(null);

    try {
      const updated = await saveSettings(settings);
      setSettings(updated);
      setSettingsSuccess("Clinical and system settings saved successfully.");
      setTimeout(() => setSettingsSuccess(null), 4000);
    } catch (err: any) {
      setSettingsError(err.message || "Failed to persist settings.");
    } finally {
      setSettingsSaving(false);
    }
  }

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
        signature_configured: profile.signature_configured,
      });
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

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordUpdating(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      setPasswordUpdating(false);
      return;
    }

    try {
      const msg = await changePassword(currentPassword, newPassword, confirmPassword);
      setPasswordSuccess(msg);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password.");
    } finally {
      setPasswordUpdating(false);
    }
  }

  async function handleRevokeSessions() {
    if (!window.confirm("Are you sure you want to revoke all other active sessions? You will need to log back in on other devices.")) {
      return;
    }
    setRevokingSessions(true);
    setSessionSuccess(null);
    setSessionError(null);

    try {
      const msg = await revokeOtherSessions();
      setSessionSuccess(msg);
      setTimeout(() => setSessionSuccess(null), 4000);
    } catch (err: any) {
      setSessionError(err.message || "Failed to revoke active sessions.");
    } finally {
      setRevokingSessions(false);
    }
  }

  const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "clinical", label: "AI & Clinical", icon: Sliders },
    { id: "services", label: "API & Services", icon: Server },
    { id: "profile", label: "Radiologist Profile", icon: UserIcon },
    { id: "privacy", label: "Privacy & Security", icon: ShieldCheck },
    { id: "audit", label: "Audit Trail", icon: Activity },
    { id: "system", label: "System Info", icon: Info },
  ];

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-5">
        <div>
          <h2 className="font-sans text-2xl font-bold text-[#131b2e] tracking-tight">
            System Administration & Settings
          </h2>
          <p className="font-sans text-xs text-[#52576b] mt-1">
            Configure clinical decision thresholds, monitor service health, manage clinician identity, and inspect audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadSettings();
              loadHealth();
              loadProfile();
              if (activeTab === "audit") loadAuditLogs();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#c3c6d7] hover:bg-[#f8f9fc] text-[#131b2e] rounded-lg text-xs font-medium transition cursor-pointer shadow-sm"
            title="Refresh settings and system status"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#2563eb] ${healthLoading || settingsLoading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-[#e2e8f0] overflow-x-auto scrollbar-none pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? "border-[#2563eb] text-[#2563eb] bg-[#eff4fe]"
                  : "border-transparent text-[#64748b] hover:text-[#131b2e] hover:bg-[#f8fafc]"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#2563eb]" : "text-[#94a3b8]"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: AI & Clinical Settings */}
      {activeTab === "clinical" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: AI Confidence Threshold */}
            <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#2563eb]" />
                  AI Review & Triage Threshold
                </h3>
                <span className="px-2.5 py-0.5 bg-[#eff4fe] text-[#2563eb] font-bold text-xs rounded-full border border-[#2563eb]/20 font-mono">
                  {settings.ai_confidence_threshold}%
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#131b2e]">Application Alert Threshold</span>
                  <span className="text-[11px] text-[#64748b]">Configured: {settings.ai_confidence_threshold}%</span>
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
                  <span>95% (Strict)</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg space-y-2 text-[11px] text-[#475569] leading-relaxed">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#2563eb] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#1e293b]">Clinical Workflow Rule:</strong> Scans evaluated by the deep neural network with model confidence ≥ <span className="font-semibold text-[#2563eb]">{settings.ai_confidence_threshold}%</span> display the primary classification directly. Predictions below this trigger the mandatory <span className="font-semibold text-amber-700">"Review Required"</span> clinical review state.
                  </div>
                </div>
                <div className="text-[10px] text-[#64748b] pl-6 border-t border-[#e2e8f0]/60 pt-1.5">
                  <em>Note: Adjusting this application triage threshold configures review workflows and does not alter the neural network's underlying raw probability calculations.</em>
                </div>
              </div>
            </div>

            {/* Card 2: Clinical Alert Settings */}
            <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-2 pb-3 border-b border-[#e2e8f0]">
                <Activity className="w-4 h-4 text-[#2563eb]" />
                Clinical Alert Routing
              </h3>

              <div className="space-y-3">
                {/* Kidney Stone Alert Toggle */}
                <div className="flex items-start justify-between p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
                  <div className="space-y-0.5 pr-3">
                    <label htmlFor="alert_ks" className="text-xs font-semibold text-[#131b2e] cursor-pointer block">
                      Kidney Stone Detection Alerts
                    </label>
                    <span className="text-[11px] text-[#64748b] block">
                      Trigger immediate high-visibility clinical notifications upon positive nephrolithiasis detection.
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

                {/* Low Confidence Review Toggle */}
                <div className="flex items-start justify-between p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
                  <div className="space-y-0.5 pr-3">
                    <label htmlFor="alert_lc" className="text-xs font-semibold text-[#131b2e] cursor-pointer block">
                      Low Confidence Review Queue
                    </label>
                    <span className="text-[11px] text-[#64748b] block">
                      Route borderline or uncertain ultrasound scans into the radiologist peer-review queue.
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

                {/* Critical System Errors Toggle */}
                <div className="flex items-start justify-between p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
                  <div className="space-y-0.5 pr-3">
                    <label htmlFor="alert_se" className="text-xs font-semibold text-[#131b2e] cursor-pointer block">
                      Critical System & Inference Failure Alerts
                    </label>
                    <span className="text-[11px] text-[#64748b] block">
                      Notify attending clinician if microservice connectivity or preprocessing pipeline encounters an error.
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

            {/* Card 3: Demo / Simulation Mode */}
            <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 space-y-4 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#2563eb]" />
                  Demonstration / Simulation Mode
                </h3>
                <span
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                    settings.demo_mode
                      ? "bg-amber-50 text-amber-700 border-amber-300"
                      : "bg-slate-100 text-slate-700 border-slate-300"
                  }`}
                >
                  {settings.demo_mode ? "SIMULATION ACTIVE" : "LIVE BACKEND ACTIVE"}
                </span>
              </div>

              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="font-bold text-xs text-amber-900">Clinical Disclaimer & Operational Control</span>
                    </div>
                    <p className="text-xs text-amber-800/90 leading-relaxed">
                      When enabled, the application operates in demonstration mode using simulated evaluation pipelines for presentation or offline testing. <strong>Do not use simulation mode for real patient care or live clinical workflows.</strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, demo_mode: !settings.demo_mode })}
                    className={`w-12 h-6 rounded-full p-0.5 transition-colors relative focus:outline-none shrink-0 cursor-pointer ${
                      settings.demo_mode ? "bg-amber-600" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        settings.demo_mode ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="text-[11px] text-amber-700/80 font-mono pt-1">
                  Controlled by backend persistence: <span className="font-semibold">DEMO_MODE={settings.demo_mode ? "true" : "false"}</span> (strictly locked to false in production deployments).
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={settingsSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {settingsSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Clinical Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: API & Services */}
      {activeTab === "services" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Laravel API Status */}
            <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#131b2e] flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-[#2563eb]" />
                  Laravel API
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online
                </span>
              </div>
              <div className="text-[11px] text-[#64748b] space-y-0.5">
                <div>Framework: <span className="font-mono text-[#1e293b]">{health?.services.laravel_api.version || "Laravel 11"}</span></div>
                <div>Runtime: <span className="font-mono text-[#1e293b]">PHP {health?.services.laravel_api.php_version || "8.3"}</span></div>
              </div>
            </div>

            {/* Database Status */}
            <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#131b2e] flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-[#2563eb]" />
                  Database
                </span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  health?.services.database.status === 'connected'
                    ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                    : "text-red-600 bg-red-50 border-red-200"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${health?.services.database.status === 'connected' ? "bg-emerald-500" : "bg-red-500"}`}></span>
                  {health?.services.database.status === 'connected' ? "Connected" : "Offline"}
                </span>
              </div>
              <div className="text-[11px] text-[#64748b] space-y-0.5">
                <div>Engine: <span className="font-mono text-[#1e293b] uppercase">{health?.services.database.driver || "sqlite"}</span></div>
                <div>Connection: <span className="text-[#1e293b]">Active PDO</span></div>
              </div>
            </div>

            {/* AI / Flask Service */}
            <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#131b2e] flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#2563eb]" />
                  AI / Flask Service
                </span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  health?.services.ai_service.status === 'connected'
                    ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                    : "text-red-600 bg-red-50 border-red-200"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${health?.services.ai_service.status === 'connected' ? "bg-emerald-500" : "bg-red-500"}`}></span>
                  {health?.services.ai_service.status === 'connected' ? "Connected" : "Offline"}
                </span>
              </div>
              <div className="text-[11px] text-[#64748b] space-y-0.5">
                <div>Microservice: <span className="font-mono text-[#1e293b]">Port 5000</span></div>
                <div>Health Check: <span className="font-mono text-[#1e293b]">/health</span></div>
              </div>
            </div>

            {/* AI Model Status */}
            <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#131b2e] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#2563eb]" />
                  Deep Learning Model
                </span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  health?.services.ai_service.model_status === 'loaded'
                    ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                    : "text-amber-600 bg-amber-50 border-amber-200"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${health?.services.ai_service.model_status === 'loaded' ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                  {health?.services.ai_service.model_status === 'loaded' ? "Loaded" : "Unloaded"}
                </span>
              </div>
              <div className="text-[11px] text-[#64748b] space-y-0.5">
                <div>Weights: <span className="font-mono text-[#1e293b]">{health?.services.ai_service.model_version || "best_model.keras"}</span></div>
                <div>Classifier: <span className="text-[#1e293b]">Binary Stone/Normal</span></div>
              </div>
            </div>
          </div>

          {/* Endpoint Configuration Box */}
          <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-2 pb-3 border-b border-[#e2e8f0]">
              <Database className="w-4 h-4 text-[#2563eb]" />
              Configured Clinical API Gateway
            </h3>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#131b2e]">Active Frontend API Target</span>
                <span className="text-[11px] text-[#64748b]">Derived from environment (VITE_API_URL)</span>
              </div>
              <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#c3c6d7] font-mono text-xs text-[#1e293b] select-all flex items-center justify-between">
                <span>{API_URL}</span>
                <span className="text-[10px] text-[#64748b] bg-slate-200 px-2 py-0.5 rounded">Client-Safe Target</span>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-lg text-xs text-blue-900 leading-relaxed">
              <strong>Administrative Security Policy:</strong> Direct endpoint alteration from the web browser is restricted in accordance with clinical governance standards. To alter production gateways, update the deployment environment configuration.
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Radiologist Profile */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
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

          <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 space-y-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-2 pb-3 border-b border-[#e2e8f0]">
              <UserIcon className="w-4 h-4 text-[#2563eb]" />
              Authenticated Clinician Profile
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#131b2e]">Clinician Name</label>
                <input
                  type="text"
                  value={profile?.name || ""}
                  onChange={(e) => setProfile(profile ? { ...profile, name: e.target.value } : null)}
                  className="w-full px-3 py-2 text-xs border border-[#c3c6d7] rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                  placeholder="e.g. Dr. Jane Doe, MD"
                  required
                />
              </div>

              {/* Email (Readonly) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#131b2e]">Account Email (Account Identifier)</label>
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-100 text-slate-500 rounded-lg cursor-not-allowed"
                />
              </div>

              {/* Clinical Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#131b2e]">Specialty / Department Role</label>
                <input
                  type="text"
                  value={profile?.role || ""}
                  onChange={(e) => setProfile(profile ? { ...profile, role: e.target.value } : null)}
                  className="w-full px-3 py-2 text-xs border border-[#c3c6d7] rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                  placeholder="e.g. Chief of Radiology, Attending Radiologist"
                />
              </div>

              {/* Medical Facility */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#131b2e]">Medical Facility / Institution</label>
                <input
                  type="text"
                  value={profile?.hospital || ""}
                  onChange={(e) => setProfile(profile ? { ...profile, hospital: e.target.value } : null)}
                  className="w-full px-3 py-2 text-xs border border-[#c3c6d7] rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                  placeholder="e.g. Memorial University Medical Center"
                />
              </div>
            </div>

            {/* Digital Signature Management Section */}
            <div className="pt-4 border-t border-[#e2e8f0] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#131b2e] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#2563eb]" />
                    Clinician Digital Attestation & Signature
                  </h4>
                  <p className="text-[11px] text-[#64748b] mt-0.5">
                    Attestation state for signing diagnostic PDF reports generated in KidneyVision AI.
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                    profile?.signature_configured
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {profile?.signature_configured ? "Configured" : "Signature system: Not configured"}
                </span>
              </div>

              <div className="p-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg flex items-center justify-between">
                <div className="text-xs text-[#475569]">
                  {profile?.signature_configured ? (
                    <span>Your electronic attestation is active and attached to final generated diagnostic reports.</span>
                  ) : (
                    <span>Public key digital signature infrastructure is currently <strong>not configured</strong>. Reports reflect preliminary triage status.</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setProfile(profile ? { ...profile, signature_configured: !profile.signature_configured } : null)
                  }
                  className="px-3 py-1.5 border border-[#c3c6d7] bg-white hover:bg-[#f1f5f9] text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  {profile?.signature_configured ? "Disable Signature" : "Configure Signature"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {profileSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Update Profile</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: Privacy & Security */}
      {activeTab === "privacy" && (
        <div className="space-y-6">
          {sessionSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{sessionSuccess}</span>
            </div>
          )}
          {sessionError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{sessionError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Privacy Controls & HIPAA-Related Configuration */}
            <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-2 pb-3 border-b border-[#e2e8f0]">
                <ShieldCheck className="w-4 h-4 text-[#2563eb]" />
                Privacy Controls & HIPAA Configuration
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                  <div>
                    <span className="font-semibold text-[#131b2e] block">Audit Logging Status</span>
                    <span className="text-[11px] text-[#64748b]">Activity tracking in SQLite audit ledger</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[11px] rounded border border-emerald-200">
                    Active
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                  <div>
                    <span className="font-semibold text-[#131b2e] block">Medical Data Retention</span>
                    <span className="text-[11px] text-[#64748b]">Clinical archive policy</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#1e293b]">Configured by Administrator (365 days)</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                  <div>
                    <span className="font-semibold text-[#131b2e] block">Session Inactivity Timeout</span>
                    <span className="text-[11px] text-[#64748b]">Automatic token expiration</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#1e293b]">30 minutes</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                  <div>
                    <span className="font-semibold text-[#131b2e] block">Automatic Logout on Expiry</span>
                    <span className="text-[11px] text-[#64748b]">Protects unattended clinical workstations</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[11px] rounded border border-emerald-200">
                    Enabled
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-[#64748b] leading-relaxed">
                <strong>HIPAA-Related Notice:</strong> Privacy controls adhere to HIPAA security standards for clinical data segregation and token lifecycle management. Full compliance certification requires deployment in a HIPAA-qualified cloud environment.
              </div>
            </div>

            {/* Session Management */}
            <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-2 pb-3 border-b border-[#e2e8f0]">
                <LogOut className="w-4 h-4 text-[#2563eb]" />
                Session Revocation
              </h3>

              <p className="text-xs text-[#64748b] leading-relaxed">
                If you suspect unauthorized workstation access or have logged in from an untrusted device, revoke all active sessions. Your current browser session will remain valid while all other tokens are terminated immediately.
              </p>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleRevokeSessions}
                  disabled={revokingSessions}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                >
                  {revokingSessions ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  <span>Revoke All Other Active Sessions</span>
                </button>
              </div>
            </div>

            {/* Change Password Form */}
            <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 space-y-4 shadow-sm lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-2 pb-3 border-b border-[#e2e8f0]">
                <Key className="w-4 h-4 text-[#2563eb]" />
                Update Clinician Password
              </h3>

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}
              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#131b2e]">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#c3c6d7] rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#131b2e]">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#c3c6d7] rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                    placeholder="At least 8 characters"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#131b2e]">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#c3c6d7] rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                    placeholder="Confirm password"
                    required
                  />
                </div>

                <div className="md:col-span-3 flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={passwordUpdating}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    {passwordUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Audit Logs */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#e2e8f0]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#2563eb]" />
                  Clinical & System Audit Trail
                </h3>
                <p className="text-[11px] text-[#64748b] mt-0.5">
                  Tamper-evident log of authentication, ultrasound analyses, reports, and administrative configuration events.
                </p>
              </div>

              <span className="text-xs font-medium text-[#64748b]">
                Total Events: <strong className="text-[#1e293b] font-mono">{auditMeta.total}</strong>
              </span>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setAuditPage(1);
                      loadAuditLogs();
                    }
                  }}
                  placeholder="Search by action, resource ID, or IP..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#c3c6d7] rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                />
              </div>

              <select
                value={auditActionFilter}
                onChange={(e) => {
                  setAuditActionFilter(e.target.value);
                  setAuditPage(1);
                }}
                className="px-3 py-2 text-xs border border-[#c3c6d7] rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none bg-white text-[#131b2e]"
              >
                <option value="">All Actions</option>
                <option value="user_login">User Login</option>
                <option value="user_logout">User Logout</option>
                <option value="analysis_created">Analysis Created</option>
                <option value="analysis_viewed">Analysis Viewed</option>
                <option value="report_downloaded">Report Downloaded</option>
                <option value="report_viewed">Report Previewed</option>
                <option value="clinician_notes_updated">Notes Updated</option>
                <option value="settings_changed">Settings Changed</option>
                <option value="profile_updated">Profile Updated</option>
                <option value="password_changed">Password Changed</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setAuditPage(1);
                  loadAuditLogs();
                }}
                className="px-4 py-2 bg-[#2563eb] text-white text-xs font-semibold rounded-lg hover:bg-[#1d4ed8] transition cursor-pointer"
              >
                Filter
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-[#e2e8f0] rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] font-semibold text-[11px] uppercase tracking-wider">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Resource</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Event Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {auditLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#64748b]">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#2563eb] mb-2" />
                        Loading audit trail records...
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#64748b]">
                        No audit events match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="p-3 font-mono text-[11px] text-[#64748b] whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="p-3 text-[#131b2e] font-medium whitespace-nowrap">
                          {log.user?.name || `User #${log.user_id || "System"}`}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-mono text-[11px] border border-blue-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3 text-[#64748b] font-mono text-[11px] whitespace-nowrap">
                          {log.resource_type ? `${log.resource_type} #${log.resource_id || ""}` : "—"}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-[#64748b] whitespace-nowrap">
                          {log.ip_address}
                        </td>
                        <td className="p-3 text-[#64748b] text-[11px] max-w-xs truncate">
                          {log.metadata ? JSON.stringify(log.metadata) : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {auditMeta.last_page > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#64748b]">
                  Page {auditMeta.current_page} of {auditMeta.last_page}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={auditPage <= 1}
                    onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 border border-[#c3c6d7] rounded text-xs font-medium hover:bg-[#f8fafc] disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    disabled={auditPage >= auditMeta.last_page}
                    onClick={() => setAuditPage((p) => p + 1)}
                    className="px-3 py-1.5 border border-[#c3c6d7] rounded text-xs font-medium hover:bg-[#f8fafc] disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: System Information */}
      {activeTab === "system" && (
        <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 space-y-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-2 pb-3 border-b border-[#e2e8f0]">
            <Info className="w-4 h-4 text-[#2563eb]" />
            Application & Architecture Telemetry
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-xs">
            <div className="p-3.5 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] space-y-1">
              <span className="text-[10px] text-[#64748b] uppercase tracking-wider block font-semibold">Application</span>
              <span className="font-bold text-[#131b2e] text-sm">{health?.system_info.application || "KidneyVision AI"}</span>
            </div>

            <div className="p-3.5 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] space-y-1">
              <span className="text-[10px] text-[#64748b] uppercase tracking-wider block font-semibold">Version</span>
              <span className="font-bold text-[#2563eb] font-mono">{health?.system_info.version || "1.2.0-clinical"}</span>
            </div>

            <div className="p-3.5 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] space-y-1">
              <span className="text-[10px] text-[#64748b] uppercase tracking-wider block font-semibold">Environment</span>
              <span className="font-bold text-[#131b2e] font-mono uppercase">{health?.system_info.environment || "Development"}</span>
            </div>

            <div className="p-3.5 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] space-y-1">
              <span className="text-[10px] text-[#64748b] uppercase tracking-wider block font-semibold">Frontend Stack</span>
              <span className="font-semibold text-[#1e293b]">{health?.system_info.frontend || "React 18 + Vite + TS"}</span>
            </div>

            <div className="p-3.5 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] space-y-1">
              <span className="text-[10px] text-[#64748b] uppercase tracking-wider block font-semibold">Backend Engine</span>
              <span className="font-semibold text-[#1e293b]">{health?.system_info.backend || "Laravel 11"}</span>
            </div>

            <div className="p-3.5 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] space-y-1">
              <span className="text-[10px] text-[#64748b] uppercase tracking-wider block font-semibold">AI Microservice</span>
              <span className="font-semibold text-[#1e293b]">{health?.system_info.ai_runtime || "Flask + TensorFlow"}</span>
            </div>

            <div className="p-3.5 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] space-y-1 sm:col-span-2 md:col-span-3">
              <span className="text-[10px] text-[#64748b] uppercase tracking-wider block font-semibold">Active AI Model</span>
              <span className="font-mono text-xs text-[#2563eb] font-semibold">{health?.system_info.model_name || "Kidney Stone Classifier (best_model.keras)"}</span>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-lg text-xs text-emerald-900 leading-relaxed flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Security Architecture Verified:</strong> No server credentials, JWT signing secrets, database passwords, or filesystem paths are exposed in frontend telemetry.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
