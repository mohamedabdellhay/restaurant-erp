import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add the auth token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const lang = localStorage.getItem("i18nextLng");
    if (lang) {
      config.headers["Accept-Language"] = lang.split("-")[0];
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to handle token expiration and 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url || "";
    const isAuthCall =
      url.includes("/login") || url.includes("/refresh-token");

    if (status !== 401 || isAuthCall || !originalRequest) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      localStorage.removeItem("restaurantSettings");
      window.location.href = window.location.pathname.startsWith("/admin")
        ? "/admin/login"
        : "/login";
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const response = await axios.post(
        `${api.defaults.baseURL}/auth/refresh-token`,
        { refreshToken: localStorage.getItem("refresh_token") },
        { withCredentials: true },
      );
      const payload = response.data?.data || response.data || {};
      const token = payload.accessToken || payload.token;
      const refreshToken =
        payload.refreshToken || localStorage.getItem("refresh_token");
      if (!token) {
        throw new Error("Missing access token");
      }
      localStorage.setItem("token", token);
      if (refreshToken) {
        localStorage.setItem("refresh_token", refreshToken);
      }
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return api(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      localStorage.removeItem("restaurantSettings");
      window.location.href = window.location.pathname.startsWith("/admin")
        ? "/admin/login"
        : "/login";
      return Promise.reject(refreshError);
    }
  },
);

export default api;
