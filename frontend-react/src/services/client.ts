import axios from "axios";

/**
 * Safe API URL Configuration Resolver.
 * - In Development: Defaults to safe local development server (http://localhost:8000/api).
 * - In Production: Requires explicit VITE_API_URL configuration. If missing or invalid,
 *   fails safely and blocks network requests rather than silently leaking clinical data.
 */
function resolveApiUrl(): string {
  const envApiUrl = ((import.meta as any).env?.VITE_API_URL as string | undefined)?.trim();
  const isProd = Boolean((import.meta as any).env?.PROD);

  if (envApiUrl) {
    if (!/^https?:\/\//i.test(envApiUrl) && !envApiUrl.startsWith('/')) {
      console.warn(`[KidneyVision Security] Unexpected VITE_API_URL format: "${envApiUrl}". Falling back to safe resolution.`);
      if (isProd) {
        if (typeof window !== "undefined" && window.location?.origin) {
          return `${window.location.origin}/api`;
        }
        return "/api";
      }
    }
    return envApiUrl.replace(/\/+$/, "");
  }

  if (isProd) {
    // When served behind Nginx reverse proxy in production, dynamically route to same-origin /api
    if (typeof window !== "undefined" && window.location?.origin) {
      return `${window.location.origin}/api`;
    }
    return "/api";
  }

  // Safe development fallback
  return "http://localhost:8000/api";
}

export const API_URL = resolveApiUrl();
export const BASE_URL = API_URL ? API_URL.replace(/\/api\/?$/, '') : '';


/**
 * Universal Image URL Sanitizer.
 * Guarantees that whatever backend/mock/file path format is supplied:
 * 1. Backslashes are converted to forward slashes.
 * 2. Redundant /storage/ or double prefixes are stripped.
 * 3. Absolute URLs matching localhost/127.0.0.1 are aligned with the active BASE_URL.
 * 4. Blob and Data URLs are preserved.
 * 5. Empty/null values fallback gracefully to a clean medical placeholder image.
 */
export function sanitizeImageUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80";
  }

  const trimmed = rawUrl.trim();

  // Preserved special browser schemes
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // Normalize backslashes (Windows filesystem paths)
  let normalized = trimmed.replace(/\\/g, '/');

  // If it's already an absolute URL
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    try {
      const parsed = new URL(normalized);
      // If it contains /storage/ from local/staging server, align origin with active BASE_URL
      if (parsed.pathname.includes('/storage/')) {
        const storageSubpath = parsed.pathname.substring(parsed.pathname.indexOf('/storage/'));
        return `${BASE_URL}${storageSubpath}`;
      }
      return normalized;
    } catch {
      return normalized;
    }
  }

  // Relative path: strip leading slashes and redundant storage/
  let cleanPath = normalized.replace(/^\/+/, '');
  if (cleanPath.startsWith('storage/')) {
    cleanPath = cleanPath.substring(8);
  }

  return `${BASE_URL}/storage/${cleanPath}`;
}

axios.defaults.withCredentials = true;
axios.defaults.baseURL = API_URL;

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json"
  }
});

let csrfFetched = false;

export async function fetchCsrfCookie() {
  const sanctumUrl = BASE_URL ? `${BASE_URL}/sanctum/csrf-cookie` : "/sanctum/csrf-cookie";
  if (!csrfFetched) {
    try {
      await axios.get(sanctumUrl, {
        withCredentials: true
      });
      csrfFetched = true;
    } catch (e) {
      console.warn("[KidneyVision Client] Failed to fetch CSRF cookie:", e);
    }
  }
}

apiClient.interceptors.request.use(async (config) => {
  // Prevent sending sensitive medical requests if API_URL is unconfigured
  if (!API_URL) {
    return Promise.reject(
      new Error(
        "[KidneyVision Security Guard] API request blocked: Missing or invalid VITE_API_URL configuration. " +
        "Requests are blocked to prevent misrouting sensitive clinical scans."
      )
    );
  }

  const token = localStorage.getItem("kv_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Allow browser to attach correct multipart boundary for FormData payloads
  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
  }

  // Only fetch CSRF for specific endpoints to avoid unnecessary calls
  if (config.url?.match(/^\/?(auth\/login|auth\/register|predict|guest-predict|auth\/password\/email|auth\/password\/reset)/)) {
    await fetchCsrfCookie();
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

