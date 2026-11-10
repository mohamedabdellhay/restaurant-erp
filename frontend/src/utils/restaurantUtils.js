// Utility functions for restaurant data management

export const getRestaurantData = () => {
  try {
    const restaurantData = localStorage.getItem("restaurant");
    return restaurantData ? JSON.parse(restaurantData) : null;
  } catch (error) {
    console.error("Failed to parse restaurant data from localStorage:", error);
    return null;
  }
};

export const getRestaurantSettings = () => {
  try {
    const settings = localStorage.getItem("restaurantSettings");
    return settings ? JSON.parse(settings) : null;
  } catch (error) {
    console.error(
      "Failed to parse restaurant settings from localStorage:",
      error,
    );
    return null;
  }
};

export const getRestaurantHeaders = () => {
  const restaurantData = getRestaurantData();

  return {
    "Content-Type": "application/json",
    "X-Restaurant-ID": restaurantData?.id || "",
    "X-Restaurant-Name": restaurantData?.name || "",
  };
};

export const addRestaurantDataToRequest = (requestData) => {
  const restaurantData = getRestaurantData();

  return {
    ...requestData,
    restaurantId: restaurantData?.id || requestData.restaurantId,
    restaurantName: restaurantData?.name || requestData.restaurantName,
  };
};
