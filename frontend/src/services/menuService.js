import api from "./api";

const menuService = {
  // Get all menu items
  getAll: async (category = null) => {
    try {
      const params = category ? `?category=${category}` : "";
      const response = await api.get(`/menu${params}`, { auth: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get single menu item by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/menu/${id}`, { auth: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new menu item
  create: async (menuItemData) => {
    try {
      const response = await api.post("/menu", menuItemData, { auth: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update menu item
  update: async (id, menuItemData) => {
    try {
      const response = await api.put(`/menu/${id}`, menuItemData, {
        auth: true,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete menu item
  delete: async (id) => {
    try {
      const response = await api.delete(`/menu/${id}`, { auth: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get menu categories
  getCategories: async () => {
    try {
      const response = await api.get("/categories", { auth: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload menu item image
  uploadImage: async (id, formData) => {
    try {
      const response = await api.post(`/menu/${id}/image`, formData, {
        auth: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Toggle menu item active status
  toggleActive: async (id) => {
    try {
      const response = await api.patch(
        `/menu/${id}/toggle`,
        {},
        { auth: true },
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get menu statistics
  getStatistics: async () => {
    try {
      const response = await api.get("/menu/statistics", { auth: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Search menu items
  search: async (query) => {
    try {
      const response = await api.get(
        `/menu/search?q=${encodeURIComponent(query)}`,
        { auth: true },
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get available items (in stock)
  getAvailable: async () => {
    try {
      const response = await api.get("/menu/available", { auth: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get menu item recipe
  getRecipe: async (id) => {
    try {
      const response = await api.get(`/menu/${id}/recipe`, { auth: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update menu item recipe
  updateRecipe: async (id, recipeData) => {
    try {
      const response = await api.patch(`/menu/${id}/recipe`, recipeData, {
        auth: true,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default menuService;
