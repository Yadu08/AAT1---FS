import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("qf_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const authCall = url.includes("/auth/login") || url.includes("/auth/register");
    if (error.response?.status === 401 && !authCall) {
      localStorage.removeItem("qf_token");
      if (window.location.pathname !== "/") window.location.assign("/");
    }
    return Promise.reject(error);
  },
);

export function apiError(error, fallback = "Something went wrong") {
  return error?.response?.data?.message || fallback;
}

export async function downloadPdf(path, filename) {
  const { data } = await api.get(path, { responseType: "blob" });
  const url = URL.createObjectURL(data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default api;
