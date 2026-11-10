import api from "./api";

const categoryService = {
  // Get all categories
  getAll: async () => {
    try {
      const response = await api.get("/categories", { auth: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get category by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/categories/${id}`, { auth: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new category (Admin or Manager only)
  create: async (categoryData) => {
    try {
      const response = await api.post("/categories", categoryData, {
        auth: true,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update category (Admin or Manager only)
  update: async (id, categoryData) => {
    try {
      const response = await api.put(`/categories/${id}`, categoryData, {
        auth: true,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete category (Admin only)
  delete: async (id) => {
    try {
      const response = await api.delete(`/categories/${id}`, { auth: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default categoryService;
