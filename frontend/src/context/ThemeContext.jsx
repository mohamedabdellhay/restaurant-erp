import React, { createContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export { ThemeContext };

function readBusinessMode() {
  try {
    const settings = JSON.parse(localStorage.getItem("restaurantSettings") || "null");
    const mode = settings?.theme?.mode;
    if (mode === "light" || mode === "dark") return mode;
  } catch {
    return null;
  }
  return null;
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return readBusinessMode() || localStorage.getItem("theme") || "light";
  });

  const [restaurantSettings, setRestaurantSettings] = useState(() => {
    const settings = localStorage.getItem("restaurantSettings");
    if (!settings || settings === "undefined" || settings === "null") {
      return null;
    }
    try {
      return JSON.parse(settings);
    } catch (error) {
      console.error(
        "Failed to parse restaurant settings from localStorage:",
        error,
      );
      return null;
    }
  });

  useEffect(() => {
    // Listen for storage changes (when user logs in)
    const handleStorageChange = (e) => {
      if (e.key === "restaurantSettings" && e.newValue) {
        if (e.newValue === "undefined" || e.newValue === "null") {
          setRestaurantSettings(null);
        } else {
          try {
            setRestaurantSettings(JSON.parse(e.newValue));
          } catch (error) {
            console.error(
              "Failed to parse restaurant settings from storage change:",
              error,
            );
            setRestaurantSettings(null);
          }
        }
      }
    };

    // Custom event for same-tab updates
    const handleThemeUpdate = (e) => {
      if (e.detail?.restaurantSettings) {
        setRestaurantSettings(e.detail.restaurantSettings);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("restaurantSettingsUpdate", handleThemeUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("restaurantSettingsUpdate", handleThemeUpdate);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    // Apply restaurant color scheme if available
    if (restaurantSettings?.theme) {
      const root = document.documentElement;
      const { primaryColor, secondaryColor, accentColor } =
        restaurantSettings.theme;

      root.style.setProperty("--restaurant-primary", primaryColor);
      root.style.setProperty("--restaurant-secondary", secondaryColor);
      root.style.setProperty("--restaurant-accent", accentColor);
      root.style.setProperty("--primary", primaryColor);
      root.style.setProperty("--secondary", secondaryColor);
      root.style.setProperty("--accent", accentColor);
    }
  }, [theme, restaurantSettings]);

  useEffect(() => {
    const mode = restaurantSettings?.theme?.mode;
    if (mode === "light" || mode === "dark") {
      setTheme(mode);
    }
  }, [restaurantSettings?.theme?.mode]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const updateRestaurantSettings = (newSettings) => {
    setRestaurantSettings(newSettings);
    localStorage.setItem("restaurantSettings", JSON.stringify(newSettings));

    // Trigger custom event for same-tab updates
    window.dispatchEvent(
      new CustomEvent("restaurantSettingsUpdate", {
        detail: { restaurantSettings: newSettings },
      }),
    );
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        restaurantSettings,
        updateRestaurantSettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
