// Sub-path support: the app can be served under a prefix such as /WellnessTourism
// (set PUBLIC_URL at build time, e.g. PUBLIC_URL=/WellnessTourism npm run build).
// In local dev PUBLIC_URL is empty, so everything stays at "/".
export const BASE_PATH = (process.env.PUBLIC_URL || "").replace(/\/+$/, "");

// Prefix an app-absolute path ("/uploads/x", "/login") with BASE_PATH.
// Leaves full URLs, protocol-relative URLs, data:/blob: URIs and already-prefixed paths untouched.
export function withBase(path) {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) {
    return path;
  }
  if (!BASE_PATH) return path;
  if (path === BASE_PATH || path.startsWith(`${BASE_PATH}/`)) return path;
  return `${BASE_PATH}${path}`;
}

// The current route path without BASE_PATH (what React Router sees).
export function currentAppPath() {
  const p = window.location.pathname;
  if (BASE_PATH && (p === BASE_PATH || p.startsWith(`${BASE_PATH}/`))) {
    return p.slice(BASE_PATH.length) || "/";
  }
  return p;
}
