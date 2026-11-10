import api from "./api";

const invoiceService = {
  // Get all invoices
  getAll: async () => {
    try {
      const response = await api.get("/invoices");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get invoice by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/invoices/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new invoice
  create: async (invoiceData) => {
    try {
      const response = await api.post("/invoices", invoiceData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update invoice
  update: async (id, invoiceData) => {
    try {
      const response = await api.put(`/invoices/${id}`, invoiceData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update payment status
  updatePaymentStatus: async (id, paymentData) => {
    try {
      const response = await api.put(`/invoices/${id}/status`, paymentData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete invoice
  delete: async (id) => {
    try {
      const response = await api.delete(`/invoices/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get invoices by status
  getByStatus: async (status) => {
    try {
      const response = await api.get(`/invoices?status=${status}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get invoices by payment method
  getByPaymentMethod: async (method) => {
    try {
      const response = await api.get(`/invoices?method=${method}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get today's invoices
  getTodayInvoices: async () => {
    try {
      const response = await api.get("/invoices/today");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get invoice statistics
  getStatistics: async () => {
    try {
      const response = await api.get("/invoices/statistics");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Generate invoice PDF
  generatePDF: async (id) => {
    try {
      const response = await api.get(`/invoices/${id}/pdf`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Send invoice by email
  sendByEmail: async (id, emailData) => {
    try {
      const response = await api.post(`/invoices/${id}/send`, emailData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default invoiceService;
