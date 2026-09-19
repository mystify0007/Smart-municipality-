import axios from "axios";

// Set VITE_API_URL (e.g. in Netlify's build env) to your deployed backend's
// origin, such as https://smart-municipality-backend.onrender.com. Left
// unset, requests stay relative to "/api" — what Vite's local dev proxy
// (vite.config.js) expects.
export const API_ORIGIN = import.meta.env.VITE_API_URL || "";

// Uploaded files (certificates, complaint photos, officer documents) are
// stored by the backend as relative paths like "/uploads/...". Resolve them
// against the same backend origin so they load when the frontend and
// backend are on different domains.
export function resolveUploadUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path}`;
}

const api = axios.create({ baseURL: `${API_ORIGIN}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
