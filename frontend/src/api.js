// Builds a full URL for a backend API call.
//
// In local development `VITE_API_URL` is left unset, so this returns the plain
// relative path (e.g. "/api/trips") and Vite's dev-server proxy forwards it to
// the Flask backend on 127.0.0.1:5000 (see vite.config.js).
//
// Usage: fetch(apiUrl('/api/trips'))
const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export function apiUrl(path) {
  return `${BASE_URL}${path}`
}
