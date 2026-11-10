import React, { useEffect } from "react";
import { useTheme } from "../hooks/useTheme";

const DynamicFavicon = () => {
  const { restaurantSettings } = useTheme();

  useEffect(() => {
    const setFavicon = (url) => {
      // Remove existing favicons
      const existingFavicons = document.querySelectorAll("link[rel*='icon']");
      existingFavicons.forEach((favicon) => favicon.remove());

      // Create new favicon link
      const link = document.createElement("link");
      link.type = "image/x-icon";
      link.rel = "shortcut icon";
      link.href = url;

      // Also create apple touch icon
      const appleLink = document.createElement("link");
      appleLink.rel = "apple-touch-icon";
      appleLink.href = url;

      document.getElementsByTagName("head")[0].appendChild(link);
      document.getElementsByTagName("head")[0].appendChild(appleLink);
    };

    // Set favicon based on restaurant logo
    if (restaurantSettings?.logo) {
      setFavicon(restaurantSettings.logo);
      console.log("Favicon set to restaurant logo:", restaurantSettings.logo);
    } else {
      // Use default restaurant logo as fallback
      setFavicon("/restaurant-logo.svg");
      console.log("Favicon set to default restaurant logo");
    }
  }, [restaurantSettings]);

  return null; // This component doesn't render anything
};

export default DynamicFavicon;
