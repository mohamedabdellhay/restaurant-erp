import api from './api';

const roleService = {
  // Get all available permissions with metadata
  getPermissionMetadata: async () => {
    try {
      const response = await api.get('/permissions/metadata', { auth: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all available permissions (legacy)
  getPermissions: async () => {
    try {
      const response = await api.get('/roles/permissions', { auth: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all roles
  getAll: async () => {
    try {
      const response = await api.get('/roles', { auth: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get role by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/roles/${id}`, { auth: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new role (Admin only)
  create: async (roleData) => {
    try {
      const response = await api.post('/roles', roleData, { auth: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update role (Admin only)
  update: async (id, roleData) => {
    try {
      const response = await api.put(`/roles/${id}`, roleData, { auth: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete role (Admin only)
  delete: async (id) => {
    try {
      const response = await api.delete(`/roles/${id}`, { auth: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get role statistics
  getStats: async () => {
    try {
      const response = await api.get('/roles/stats', { auth: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Assign role to user (Admin/Manager only)
  assignToUser: async (userId, roleId) => {
    try {
      const response = await api.patch(`/users/${userId}/role`, { roleId }, { auth: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get users by role
  getUsersByRole: async (roleId) => {
    try {
      const response = await api.get(`/roles/${roleId}/users`, { auth: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default roleService;
