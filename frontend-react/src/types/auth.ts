/**
 * Authentication and User Account Types
 */

export interface User {
  id?: number;
  email: string;
  name: string;
  role: string;
  hospital: string;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  signature_configured?: boolean;
  signature_url?: string | null;
  mfa_enabled?: boolean;
  token?: string;
}


export interface APIConfig {
  apiUrl: string;
  isCustomServer: boolean;
}
