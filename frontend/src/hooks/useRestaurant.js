import { useAuth } from "../hooks/useAuth";

export const useRestaurant = () => {
  const { user } = useAuth();

  if (!user) {
    return {
      restaurant: null,
      settings: null,
      theme: null,
      // Helper functions return defaults
      getRestaurantName: () => "Restaurant",
      getCurrency: () => "USD",
      getTaxPercent: () => 0,
      getServiceCharge: () => 0,
      getThemeColors: () => ({
        primary: "#f59e0b",
        secondary: "#6366f1",
        accent: "#10b981",
        mode: "light",
      }),
      getRestaurantId: () => null,
      getOpeningHours: () => ({}),
      getSocialMedia: () => ({}),
      getBusinessDetails: () => ({
        vatNumber: "",
        crNumber: "",
      }),
    };
  }

  const restaurant = user.restaurant;
  const settings = user.restaurantSettings || restaurant?.settings;
  const theme = settings?.theme;

  return {
    restaurant,
    settings,
    theme,
    // Helper functions
    getRestaurantName: () => restaurant?.name || "Restaurant",
    getRestaurantId: () => restaurant?._id || restaurant?.id,
    getCurrency: () => restaurant?.currency || "USD",
    getTaxPercent: () => settings?.taxPercent || 0,
    getServiceCharge: () => settings?.serviceChargePercent || 0,
    getThemeColors: () => ({
      primary: theme?.primaryColor || "#f59e0b",
      secondary: theme?.secondaryColor || "#6366f1",
      accent: theme?.accentColor || "#10b981",
      mode: theme?.mode || "light",
      logo: theme?.logo ? decodeURIComponent(theme.logo) : "",
    }),
    getOpeningHours: () => restaurant?.openingHours || {},
    getSocialMedia: () => restaurant?.socialMedia || {},
    getBusinessDetails: () => ({
      vatNumber: restaurant?.vatNumber || "",
      crNumber: restaurant?.crNumber || "",
    }),
    // Get complete restaurant data for settings
    getRestaurantData: () => ({
      _id: restaurant?._id || restaurant?.id,
      name: restaurant?.name || "",
      address: restaurant?.address || "",
      phone: restaurant?.phone || "",
      email: restaurant?.email || "",
      website: restaurant?.website || "",
      currency: restaurant?.currency || "USD",
      vatNumber: restaurant?.vatNumber || "",
      crNumber: restaurant?.crNumber || "",
      settings: settings || {
        taxPercent: 0,
        serviceChargePercent: 0,
        theme: {
          primaryColor: "#f59e0b",
          secondaryColor: "#6366f1",
          accentColor: "#10b981",
          logo: "",
          mode: "light",
        },
      },
      openingHours: restaurant?.openingHours || {
        monday: "",
        tuesday: "",
        wednesday: "",
        thursday: "",
        friday: "",
        saturday: "",
        sunday: "",
      },
      socialMedia: restaurant?.socialMedia || {
        facebook: "",
        instagram: "",
        twitter: "",
      },
    }),
  };
};
