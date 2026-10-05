/**
 * Authentication and User Account Types
 */

export interface User {
  email: string;
  name: string;
  role: string;
  hospital: string;
  avatarUrl: string;
  token?: string;
}

export interface APIConfig {
  apiUrl: string;
  isCustomServer: boolean;
}
