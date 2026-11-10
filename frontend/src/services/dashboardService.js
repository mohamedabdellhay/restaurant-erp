import api from "./api";

export const dashboardService = {
  // Get dashboard overview metrics
  getOverview: async (params = {}) => {
    const response = await api.get("/dashboard/overview", { params });
    return response.data;
  },

  // Get revenue analytics with trends
  getRevenueAnalytics: async (params = {}) => {
    const response = await api.get("/dashboard/revenue", { params });
    return response.data;
  },

  // Get top selling menu items
  getTopItems: async (params = {}) => {
    const response = await api.get("/dashboard/top-items", { params });
    return response.data;
  },

  // Get staff performance metrics
  getStaffPerformance: async (params = {}) => {
    const response = await api.get("/dashboard/staff-performance", { params });
    return response.data;
  },

  // Get customer analytics
  getCustomerAnalytics: async (params = {}) => {
    const response = await api.get("/dashboard/customers", { params });
    return response.data;
  },

  // Get real-time metrics
  getRealTimeMetrics: async () => {
    const response = await api.get("/dashboard/realtime");
    return response.data;
  },

  // Get inventory alerts
  getInventoryAlerts: async () => {
    const response = await api.get("/dashboard/inventory-alerts");
    return response.data;
  },
};

export default dashboardService;
