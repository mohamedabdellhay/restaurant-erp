import api from "./api";

const tableService = {
  // Get all tables
  getAll: async () => {
    try {
      const response = await api.get("/tables");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get table by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/tables/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new table
  create: async (tableData) => {
    try {
      const response = await api.post("/tables", tableData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update table
  update: async (id, tableData) => {
    try {
      const response = await api.patch(`/tables/${id}`, tableData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete table
  delete: async (id) => {
    try {
      const response = await api.delete(`/tables/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default tableService;
