import api from './api';

/**
 * Service for managing permissions and role-related operations
 */

/**
 * Fetch permission metadata from the backend
 * Returns permissions grouped by module with user-friendly labels
 * @returns {Promise<Array>} Array of permission modules with their permissions
 */
export const getPermissionMetadata = async () => {
  try {
    const response = await api.get('/permissions/metadata');
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch permission metadata:', error);
    throw error;
  }
};

/**
 * Fetch all available roles
 * @returns {Promise<Array>} Array of role objects
 */
export const getRoles = async () => {
  try {
    const response = await api.get('/roles');
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    throw error;
  }
};

/**
 * Fetch a specific role by ID
 * @param {string} roleId - The ID of the role to fetch
 * @returns {Promise<Object>} Role object
 */
export const getRole = async (roleId) => {
  try {
    const response = await api.get(`/roles/${roleId}`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch role:', error);
    throw error;
  }
};

/**
 * Create a new role
 * @param {Object} roleData - Role data including name and permissions
 * @returns {Promise<Object>} Created role object
 */
export const createRole = async (roleData) => {
  try {
    const response = await api.post('/roles', roleData);
    return response.data.data;
  } catch (error) {
    console.error('Failed to create role:', error);
    throw error;
  }
};

/**
 * Update an existing role
 * @param {string} roleId - The ID of the role to update
 * @param {Object} roleData - Updated role data
 * @returns {Promise<Object>} Updated role object
 */
export const updateRole = async (roleId, roleData) => {
  try {
    const response = await api.put(`/roles/${roleId}`, roleData);
    return response.data.data;
  } catch (error) {
    console.error('Failed to update role:', error);
    throw error;
  }
};

/**
 * Delete a role
 * @param {string} roleId - The ID of the role to delete
 * @returns {Promise<void>}
 */
export const deleteRole = async (roleId) => {
  try {
    await api.delete(`/roles/${roleId}`);
  } catch (error) {
    console.error('Failed to delete role:', error);
    throw error;
  }
};

/**
 * Get role statistics (number of users per role)
 * @returns {Promise<Object>} Role statistics
 */
export const getRoleStatistics = async () => {
  try {
    const response = await api.get('/roles/statistics');
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch role statistics:', error);
    throw error;
  }
};

/**
 * Assign role to staff member
 * @param {string} staffId - The ID of the staff member
 * @param {string} roleId - The ID of the role to assign
 * @returns {Promise<Object>} Updated staff object
 */
export const assignRoleToStaff = async (staffId, roleId) => {
  try {
    const response = await api.put(`/staff/${staffId}/role`, { roleId });
    return response.data.data;
  } catch (error) {
    console.error('Failed to assign role to staff:', error);
    throw error;
  }
};

/**
 * Get staff members with their roles
 * @param {Object} params - Query parameters (pagination, filters, etc.)
 * @returns {Promise<Object>} Staff with roles data
 */
export const getStaffWithRoles = async (params = {}) => {
  try {
    const response = await api.get('/staff', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch staff with roles:', error);
    throw error;
  }
};

/**
 * Helper function to group permissions by module
 * @param {Array} permissions - Array of permission objects
 * @returns {Object} Permissions grouped by module
 */
export const groupPermissionsByModule = (permissions) => {
  return permissions.reduce((acc, permission) => {
    const module = permission.module || 'Other';
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(permission);
    return acc;
  }, {});
};

/**
 * Helper function to format permissions for form submission
 * @param {Object} groupedPermissions - Permissions grouped by module
 * @returns {Array} Flat array of permission keys
 */
export const formatPermissionsForSubmission = (groupedPermissions) => {
  const permissions = [];
  
  Object.values(groupedPermissions).forEach(modulePermissions => {
    modulePermissions.forEach(permission => {
      if (permission.selected) {
        permissions.push(permission.key);
      }
    });
  });
  
  return permissions;
};

export default {
  getPermissionMetadata,
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getRoleStatistics,
  assignRoleToStaff,
  getStaffWithRoles,
  groupPermissionsByModule,
  formatPermissionsForSubmission,
};
