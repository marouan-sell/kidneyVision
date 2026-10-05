import { apiClient } from "./client";
import { AppSettings, UserProfile, AuditLogEntry } from "../types";

/**
 * 1. GET /settings
 */
export async function fetchSettings(): Promise<AppSettings> {
  try {
    const response = await apiClient.get('/settings');
    return response.data.data;
  } catch (e: any) {
    console.error("Failed to fetch settings:", e);
    return {
      ai_confidence_threshold: 85,
      alert_kidney_stone: true,
      alert_low_confidence: true,
      alert_system_errors: true,
      demo_mode: false,
      audit_logging_enabled: true,
      session_timeout_minutes: 30,
      auto_logout_enabled: true,
      data_retention_days: 365,
    };
  }
}

/**
 * 2. PUT /settings
 */
export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  try {
    const response = await apiClient.put('/settings', settings);
    return response.data.data;
  } catch (e: any) {
    const msg = e.response?.data?.message || "Failed to update settings.";
    throw new Error(msg);
  }
}

/**
 * 3. GET /profile
 */
export async function fetchUserProfile(): Promise<UserProfile> {
  try {
    const response = await apiClient.get('/profile');
    return response.data.data;
  } catch (e: any) {
    console.error("Failed to fetch user profile:", e);
    throw new Error(e.response?.data?.message || "Failed to load profile.");
  }
}

/**
 * 4. PUT /profile
 */
export async function saveUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  try {
    const response = await apiClient.put('/profile', profile);
    return response.data.data;
  } catch (e: any) {
    throw new Error(e.response?.data?.message || "Failed to update profile.");
  }
}

/**
 * 5. POST /profile/password
 */
export async function changePassword(
  currentPassword: string,
  password: string,
  passwordConfirmation: string
): Promise<string> {
  try {
    const response = await apiClient.post('/profile/password', {
      current_password: currentPassword,
      password: password,
      password_confirmation: passwordConfirmation,
    });
    return response.data.message || "Password updated successfully.";
  } catch (e: any) {
    throw new Error(e.response?.data?.message || "Failed to update password.");
  }
}

/**
 * 6. POST /profile/revoke-sessions
 */
export async function revokeOtherSessions(): Promise<string> {
  try {
    const response = await apiClient.post('/profile/revoke-sessions');
    return response.data.message || "Other active sessions revoked.";
  } catch (e: any) {
    throw new Error(e.response?.data?.message || "Failed to revoke sessions.");
  }
}

/**
 * 7. GET /audit-logs
 */
export async function fetchAuditLogs(params?: {
  page?: number;
  action?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}): Promise<{ logs: AuditLogEntry[]; meta: any }> {
  try {
    const response = await apiClient.get('/audit-logs', { params });
    return {
      logs: response.data.data,
      meta: response.data.meta,
    };
  } catch (e: any) {
    console.error("Failed to fetch audit logs:", e);
    return {
      logs: [],
      meta: { current_page: 1, last_page: 1, total: 0 }
    };
  }
}
