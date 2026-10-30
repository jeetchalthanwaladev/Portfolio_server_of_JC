const configuredApiUrl = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");

// Keep local development on Vite's /api proxy, and target the configured API in production.
export const API_BASE_URL = import.meta.env.DEV ? "" : configuredApiUrl;

export function apiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function apiFetch(path, options = {}) {
  return fetch(apiUrl(path), {
    ...options,
    credentials: "include",
  });
}
