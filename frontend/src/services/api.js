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
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to handle token expiration and 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and not already retrying and not a login request
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/login")
    ) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh-token`,
          {
            refreshToken: localStorage.getItem("refresh_token"),
          },
          { withCredentials: true },
        );

        const { token, refreshToken } = response.data;
        localStorage.setItem("token", token);
        localStorage.setItem("refresh_token", refreshToken);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear auth and redirect to login
        console.error("Token refresh failed, logging out user");

        // Clear all auth-related data
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        localStorage.removeItem("restaurantSettings");

        // Redirect to login page
        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    // Handle other 401 cases (like refresh token endpoint itself failing)
    if (error.response?.status === 401) {
      console.error("401 Unauthorized, logging out user");

      // Clear all auth-related data
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      localStorage.removeItem("restaurantSettings");

      // Redirect to login page
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
