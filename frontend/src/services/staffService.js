import api from "./api";

const staffService = {
  // Get all staff members
  getAll: async () => {
    try {
      const response = await api.get("/staff");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get staff member by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/staff/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new staff member
  create: async (staffData) => {
    try {
      const response = await api.post("/staff", staffData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update staff member
  update: async (id, staffData) => {
    try {
      const response = await api.put(`/staff/${id}`, staffData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete staff member
  delete: async (id) => {
    try {
      const response = await api.delete(`/staff/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Toggle staff active status
  toggleStatus: async (id, status) => {
    try {
      const response = await api.patch(`/staff/${id}/toggle-status`, {
        isActive: !status,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default staffService;
