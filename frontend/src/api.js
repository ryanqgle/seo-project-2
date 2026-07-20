// Builds a full URL for backend API calls
//
// Local dev:
// - Leave VITE_API_URL unset.
// - Vite proxy handles relative "/api/..." requests
//
// Production:
// - Set VITE_API_URL to the deployed Flask backend URL
// - Example: https://your-backend.onrender.com
const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export function apiUrl(path) {
  return `${BASE_URL}${path}`
}