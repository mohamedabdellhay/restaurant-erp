import api from "./api";

const paymentService = {
  // Get all supported payment gateways
  getSupportedGateways: async () => {
    const response = await api.get("/payments/gateways");
    return response.data;
  },

  // Get settings for a specific gateway provider
  getGatewaySettings: async (provider) => {
    const response = await api.get(`/payments/settings/${provider}`);
    return response.data;
  },

  // Update settings for a specific gateway provider
  updateGatewaySettings: async (provider, settingsData) => {
    const response = await api.post(`/payments/settings/${provider}`, settingsData);
    return response.data;
  },

  // Upload logo for a payment gateway
  uploadGatewayLogo: async (provider, file) => {
    const formData = new FormData();
    formData.append("logo", file);
    const response = await api.post(`/payments/settings/${provider}/logo`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Get Kashier gateway settings (Legacy/Shortcut)
  getKashierSettings: async () => {
    const response = await api.get("/payments/settings/kashier");
    return response.data;
  },

  // Update Kashier gateway settings (Legacy/Shortcut)
  updateKashierSettings: async (settingsData) => {
    const response = await api.post("/payments/settings/kashier", settingsData);
    return response.data;
  },
};

export default paymentService;
