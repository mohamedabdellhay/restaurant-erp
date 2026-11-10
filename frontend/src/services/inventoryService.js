import api from "./api";

const inventoryService = {
  // Get all inventory items
  getAll: async () => {
    try {
      const response = await api.get("/inventory/items", { auth: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get item by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/inventory/items/${id}`, { auth: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new inventory item
  create: async (itemData) => {
    try {
      const response = await api.post("/inventory/items", itemData, {
        auth: true,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update inventory item
  update: async (id, itemData) => {
    try {
      const response = await api.put(`/inventory/items/${id}`, itemData, {
        auth: true,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete inventory item
  delete: async (id) => {
    try {
      const response = await api.delete(`/inventory/items/${id}`, {
        auth: true,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get low stock alerts
  getLowStock: async () => {
    try {
      const response = await api.get("/inventory/items/low-stock", {
        auth: true,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update stock level (addition/deduction)
  updateStock: async (id, stockData) => {
    try {
      const response = await api.patch(
        `/inventory/items/${id}/stock`,
        stockData,
        { auth: true },
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get stock movements for an item
  getStockMovements: async (id) => {
    try {
      const response = await api.get(`/inventory/items/${id}/movements`, {
        auth: true,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get inventory statistics
  getStatistics: async () => {
    try {
      const response = await api.get("/inventory/items/statistics", {
        auth: true,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get items by supplier
  getBySupplier: async (supplierId) => {
    try {
      const response = await api.get(
        `/inventory/items?supplier=${supplierId}`,
        { auth: true },
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get items by category
  getByCategory: async (category) => {
    try {
      const response = await api.get(`/inventory/items?category=${category}`, {
        auth: true,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Search inventory items
  search: async (query) => {
    try {
      const response = await api.get(`/inventory/items/search?q=${query}`, {
        auth: true,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Bulk stock update
  bulkStockUpdate: async (updates) => {
    try {
      const response = await api.post(
        "/inventory/items/bulk-stock",
        { updates },
        { auth: true },
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get inventory valuation
  getValuation: async () => {
    try {
      const response = await api.get("/inventory/items/valuation", {
        auth: true,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default inventoryService;
