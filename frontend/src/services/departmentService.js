import api from "./api";

/**
 * Department Service
 * Handles all department-related API calls for the restaurant ERP system
 */

const departmentService = {
  /**
   * Get all departments for the current restaurant
   * @returns {Promise} - Promise that resolves to departments list
   */
  getAll: async () => {
    try {
      const response = await api.get("/departments");
      return response.data;
    } catch (error) {
      console.error("Error fetching departments:", error);
      throw error;
    }
  },

  /**
   * Get department by ID
   * @param {string} id - Department ID
   * @returns {Promise} - Promise that resolves to department object
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/departments/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching department:", error);
      throw error;
    }
  },

  /**
   * Create a new department
   * @param {Object} departmentData - Department data
   * @param {string} departmentData.name - Department name
   * @param {string} departmentData.description - Department description
   * @returns {Promise} - Promise that resolves to created department
   */
  create: async (departmentData) => {
    try {
      const response = await api.post("/departments", departmentData);
      return response.data;
    } catch (error) {
      console.error("Error creating department:", error);
      throw error;
    }
  },

  /**
   * Update an existing department
   * @param {string} id - Department ID
   * @param {Object} departmentData - Updated department data
   * @returns {Promise} - Promise that resolves to updated department
   */
  update: async (id, departmentData) => {
    try {
      const response = await api.put(`/departments/${id}`, departmentData);
      return response.data;
    } catch (error) {
      console.error("Error updating department:", error);
      throw error;
    }
  },

  /**
   * Delete a department
   * @param {string} id - Department ID
   * @returns {Promise} - Promise that resolves to deletion response
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`/departments/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting department:", error);
      throw error;
    }
  },

  /**
   * Get department permissions (for role-based access)
   * @returns {Promise} - Promise that resolves to available permissions
   */
  getPermissions: async () => {
    try {
      const response = await api.get("/departments/permissions");
      return response.data;
    } catch (error) {
      console.error("Error fetching department permissions:", error);
      throw error;
    }
  },
};

export default departmentService;
