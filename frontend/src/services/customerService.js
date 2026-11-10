import api from "./api";

const customerService = {
  // Get all customers
  getAll: async () => {
    try {
      const response = await api.get("/customers");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Search customers (by name or phone)
  search: async (query) => {
    try {
      const response = await api.get(`/customers/search?q=${query}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get customer by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/customers/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new customer
  create: async (customerData) => {
    try {
      const response = await api.post("/customers", customerData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update customer
  update: async (id, customerData) => {
    try {
      const response = await api.put(`/customers/${id}`, customerData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete customer
  delete: async (id) => {
    try {
      const response = await api.delete(`/customers/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get customer statistics
  getStatistics: async () => {
    try {
      const response = await api.get("/customers/statistics");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get recent customers
  getRecent: async (limit = 10) => {
    try {
      const response = await api.get(`/customers/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get customers by phone
  getByPhone: async (phone) => {
    try {
      const response = await api.get(`/customers/phone/${phone}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get customers by name
  getByName: async (name) => {
    try {
      const response = await api.get(`/customers/name/${name}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default customerService;
