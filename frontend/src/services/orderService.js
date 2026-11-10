import api from "./api";

const orderService = {
  // Get all orders
  getAll: async () => {
    const response = await api.get("/orders");
    return response.data;
  },

  // Get order by ID
  getById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // Create new order
  create: async (orderData) => {
    const response = await api.post("/orders", orderData);
    return response.data;
  },

  // Update order
  update: async (id, orderData) => {
    const response = await api.put(`/orders/${id}`, orderData);
    return response.data;
  },

  // Update order status
  updateStatus: async (id, statusData) => {
    const response = await api.put(`/orders/${id}`, statusData);
    return response.data;
  },

  // Delete order
  delete: async (id) => {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },

  // Get orders by status
  getByStatus: async (status) => {
    const response = await api.get(`/orders?status=${status}`);
    return response.data;
  },

  // Get orders by table
  getByTable: async (tableId) => {
    const response = await api.get(`/orders?table=${tableId}`);
    return response.data;
  },

  // Get orders by customer
  getByCustomer: async (customerId) => {
    const response = await api.get(`/orders?customer=${customerId}`);
    return response.data;
  },

  // Get today's orders
  getTodayOrders: async () => {
    const response = await api.get("/orders/today");
    return response.data;
  },

  // Get order statistics
  getStatistics: async () => {
    const response = await api.get("/orders/statistics");
    return response.data;
  },

  // Search orders by customer name or phone
  search: async (query) => {
    const response = await api.get(
      `/orders/search?q=${encodeURIComponent(query)}`,
    );
    return response.data;
  },

  // Get payment link for an order
  getPaymentLink: async (id) => {
    const response = await api.get(`/orders/${id}/payment-link`);
    return response.data;
  },
};

export default orderService;
