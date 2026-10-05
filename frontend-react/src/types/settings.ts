/**
 * Settings, Clinician Profile, and Audit Log Types
 */

export interface AppSettings {
  ai_confidence_threshold: number;
  alert_kidney_stone: boolean;
  alert_low_confidence: boolean;
  alert_system_errors: boolean;
  demo_mode: boolean;
  audit_logging_enabled: boolean;
  session_timeout_minutes: number;
  auto_logout_enabled: boolean;
  data_retention_days: number;
}

export interface AuditLogEntry {
  id: number;
  user_id: number | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string;
  user_agent: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  hospital: string;
  signature_configured: boolean;
  is_admin: boolean;
  created_at?: string;
}
