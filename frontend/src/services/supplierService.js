import api from "./api";

const supplierService = {
  // Get all suppliers
  getAll: async () => {
    try {
      const response = await api.get("/inventory/suppliers", { auth: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get supplier by ID
  getById: async (id) => {
    const response = await api.get(`/inventory/suppliers/${id}`, {
      auth: true,
    });
    return response.data;
  },

  // Create new supplier
  create: async (supplierData) => {
    const response = await api.post("/inventory/suppliers", supplierData, {
      auth: true,
    });
    return response.data;
  },

  // Update supplier
  update: async (id, supplierData) => {
    const response = await api.put(`/inventory/suppliers/${id}`, supplierData, {
      auth: true,
    });
    return response.data;
  },

  // Delete supplier
  delete: async (id) => {
    const response = await api.delete(`/inventory/suppliers/${id}`, {
      auth: true,
    });
    return response.data;
  },

  // Get supplier account statement
  getStatement: async (id) => {
    try {
      const response = await api.get(`/inventory/suppliers/${id}/statement`, {
        auth: true,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Record supplier payment
  recordPayment: async (id, paymentData) => {
    const response = await api.post(
      `/inventory/suppliers/${id}/payments`,
      paymentData,
      {
        auth: true,
      },
    );
    return response.data;
  },

  // Get supplier statistics
  getStatistics: async () => {
    try {
      const response = await api.get("/inventory/suppliers/statistics", {
        auth: true,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get suppliers by payment terms
  getByPaymentTerms: async (paymentTerms) => {
    try {
      const response = await api.get(
        `/inventory/suppliers?paymentTerms=${paymentTerms}`,
        { auth: true },
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Search suppliers
  search: async (query) => {
    try {
      const response = await api.get(`/inventory/suppliers/search?q=${query}`, {
        auth: true,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default supplierService;
