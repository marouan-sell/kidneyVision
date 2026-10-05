import { apiClient, fetchCsrfCookie } from "./client";
import { User } from "../types";

/**
 * 1. POST /auth/login
 */
export async function loginUser(email: string, password: string): Promise<{ token: string; user: User }> {
  try {
    await fetchCsrfCookie();
    const response = await apiClient.post('/auth/login', { email, password });

    if (!response.data.success) {
      throw new Error(response.data.message || "Invalid credentials.");
    }

    return {
      token: response.data.data.token,
      user: response.data.data.user
    };
  } catch (e: any) {
    throw new Error(e.response?.data?.message || "Invalid email or password.");
  }
}

/**
 * 2. POST /auth/register
 */
export async function registerUser(
  email: string,
  fullName: string,
  hospital: string,
  password: string,
  password_confirmation: string
): Promise<{ token: string; user: User }> {
  try {
    await fetchCsrfCookie();
    const response = await apiClient.post('/auth/register', {
      email,
      name: fullName,
      hospital,
      password,
      password_confirmation
    });

    if (!response.data.success) {
      throw new Error(response.data.message || "Registration failed.");
    }

    return {
      token: response.data.data.token,
      user: response.data.data.user
    };
  } catch (e: any) {
    const errorData = e.response?.data;
    if (errorData?.errors) {
      const firstError = Object.values(errorData.errors)[0];
      if (Array.isArray(firstError)) {
        throw new Error(firstError[0]);
      }
    }
    throw new Error(errorData?.message || "Registration failed. Please check your credentials.");
  }
}

/**
 * 3. POST /password/email
 */
export async function sendPasswordResetLink(email: string): Promise<string> {
  try {
    await fetchCsrfCookie();
    const response = await apiClient.post('/auth/password/email', { email });
    return response.data.message || "Reset link sent.";
  } catch (e: any) {
    throw new Error(e.response?.data?.message || "Failed to send reset link.");
  }
}

/**
 * 4. POST /password/reset
 */
export async function resetPassword(data: {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}): Promise<string> {
  try {
    await fetchCsrfCookie();
    const response = await apiClient.post('/auth/password/reset', data);
    return response.data.message || "Password has been successfully reset.";
  } catch (e: any) {
    throw new Error(e.response?.data?.message || "Failed to reset password.");
  }
}
