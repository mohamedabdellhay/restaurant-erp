import React, { createContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { getErrorMessage } from "../utils/errorMessage";
import { useTheme } from "../hooks/useTheme";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserRole,
  isAdmin,
  isManagerOrHigher,
} from "../utils/permissionUtils";

const AuthContext = createContext(null);

export { AuthContext };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { updateRestaurantSettings } = useTheme();

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get("/auth/me");
      const staff = response.data.data;

      // Extract restaurant settings from staff data
      const restaurantSettings =
        staff.restaurantSettings || staff.restaurant?.settings;

      // Update user data with restaurant settings (fallback to empty object if not provided)
      const userData = {
        ...staff,
        restaurantSettings: restaurantSettings || {},
      };

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem(
        "restaurantSettings",
        JSON.stringify(restaurantSettings),
      );
      // Store restaurant settings separately for theme context (only if they exist and have content)
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  }, []);

  useEffect(() => {
    // Check for existing session/token on mount
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // Apply restaurant settings if available
      const restaurantSettings =
        parsedUser.restaurantSettings ||
        JSON.parse(localStorage.getItem("restaurantSettings") || "null");
      if (restaurantSettings) {
        localStorage.setItem(
          "restaurantSettings",
          JSON.stringify(restaurantSettings),
        );
      }
    }

    if (token) {
      fetchProfile();
    }

    setLoading(false);
  }, [fetchProfile]);

  const login = async (email, password, portal = "restaurant") => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/login", { email, password });
      console.log("Full API response:", response.data);

      const { staff, accessToken, refreshToken } = response.data.data;
      const owner = Boolean(staff.isPlatformOwner);
      if ((portal === "admin") !== owner) {
        return portal === "admin" ? "admin_only" : "restaurant_only";
      }

      console.log("Destructured values:", {
        staff,
        accessToken: accessToken ? "present" : "missing",
        refreshToken: refreshToken ? "present" : "missing",
      });

      // Ensure restaurantSettings are properly extracted
      const finalRestaurantSettings =
        response.data.data.restaurantSettings ||
        response.data.data.restaurant?.settings;
      console.log("Final restaurant settings:", finalRestaurantSettings);

      // Also store full restaurant data for other components
      const restaurantData = response.data.data.restaurant;
      console.log("Restaurant data:", restaurantData);

      const userData = {
        ...staff,
        restaurantSettings: finalRestaurantSettings,
      };

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);

      // Store restaurant settings separately for theme context
      if (finalRestaurantSettings) {
        console.log("Storing restaurant settings:", finalRestaurantSettings);
        localStorage.setItem(
          "restaurantSettings",
          JSON.stringify(finalRestaurantSettings),
        );
        // Trigger theme update
        console.log("Triggering theme update with:", finalRestaurantSettings);
        updateRestaurantSettings(finalRestaurantSettings);
      } else if (!staff.isPlatformOwner) {
        console.log(
          "No restaurant settings in login response, fetching separately...",
        );
        // Fetch restaurant settings separately for non-admin users
        try {
          const restaurantResponse = await api.get("/restaurant/settings");
          const fetchedSettings =
            restaurantResponse.data.data || restaurantResponse.data;
          if (fetchedSettings) {
            console.log(
              "Fetched restaurant settings separately:",
              fetchedSettings,
            );
            // Update user data with fetched settings
            const updatedUserData = {
              ...userData,
              restaurantSettings: fetchedSettings,
            };
            setUser(updatedUserData);
            localStorage.setItem("user", JSON.stringify(updatedUserData));

            // Store restaurant settings
            localStorage.setItem(
              "restaurantSettings",
              JSON.stringify(fetchedSettings),
            );
            // Trigger theme update
            updateRestaurantSettings(fetchedSettings);
          }
        } catch (fetchError) {
          console.log(
            "Failed to fetch restaurant settings separately:",
            fetchError,
          );
        }
      }

      // Store full restaurant data for other components
      if (restaurantData) {
        localStorage.setItem("restaurant", JSON.stringify(restaurantData));
        console.log("Stored restaurant data:", restaurantData);
      }

      return true;
    } catch (err) {
      setError(getErrorMessage(err, "Login failed. Please check your credentials."));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await api.put("/auth/profile", data);
      const updatedUser = response.data.data;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return { success: true, message: "Profile updated successfully" };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to update profile",
      };
    }
  };

  const changePassword = async (data) => {
    try {
      await api.put("/auth/change-password", data);
      return { success: true, message: "Password changed successfully" };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to change password",
      };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("restaurantSettings");
    }
  };

  // Permission checking methods for convenience
  const checkPermission = (permission) => hasPermission(user, permission);
  const checkAnyPermission = (permissions) =>
    hasAnyPermission(user, permissions);
  const checkAllPermissions = (permissions) =>
    hasAllPermissions(user, permissions);
  const getUserRoleName = () => getUserRole(user);
  const checkIsAdmin = () => isAdmin(user);
  const checkIsManagerOrHigher = () => isManagerOrHigher(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        updateProfile,
        changePassword,
        // Permission checking methods
        hasPermission: checkPermission,
        hasAnyPermission: checkAnyPermission,
        hasAllPermissions: checkAllPermissions,
        getUserRole: getUserRoleName,
        isAdmin: checkIsAdmin,
        isManagerOrHigher: checkIsManagerOrHigher,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
