import api from "./api";

export const restaurantService = {
  // Get restaurant by ID
  getRestaurant: async (id) => {
    const response = await api.get(`/restaurant/${id}`);
    return response.data;
  },

  // Update restaurant data
  updateRestaurant: async (id, data) => {
    const response = await api.put(`/restaurant/${id}`, data);
    return response.data;
  },

  // Upload restaurant logo
  uploadLogo: async (id, file) => {
    const formData = new FormData();
    formData.append("logo", file);

    // Only add restaurantId if provided (optional field)
    if (id) {
      formData.append("restaurantId", id);
    }

    const response = await api.post("/restaurant/upload-logo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Return the response data directly
    return response.data;
  },

  // Update theme settings specifically
  updateTheme: async (id, themeData) => {
    const response = await api.put(`/restaurant/${id}/theme`, themeData);
    return response.data;
  },

  // Update financial settings
  updateFinancialSettings: async (id, financialData) => {
    const response = await api.put(
      `/restaurant/${id}/financial`,
      financialData,
    );
    return response.data;
  },

  // Update opening hours
  updateOpeningHours: async (id, openingHours) => {
    const response = await api.put(`/restaurant/${id}/hours`, openingHours);
    return response.data;
  },

  // Update social media links
  updateSocialMedia: async (id, socialMedia) => {
    const response = await api.put(`/restaurant/${id}/social`, socialMedia);
    return response.data;
  },
};

export default restaurantService;
