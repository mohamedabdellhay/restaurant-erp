import { hasPermission, hasAnyPermission, hasAllPermissions } from '@utils/permissionUtils';
import { useAuth } from '@hooks/useAuth';

/**
 * Hook for checking permissions in functional components
 * 
 * @returns {Object} - Permission checking functions
 */
export const usePermissions = () => {
  const { user } = useAuth();
  
  return {
    hasPermission: (permission) => hasPermission(user, permission),
    hasAnyPermission: (permissions) => hasAnyPermission(user, permissions),
    hasAllPermissions: (permissions) => hasAllPermissions(user, permissions),
    getUserRole: () => user?.role?.name || 'Unknown',
    isAdmin: () => {
      const role = user?.role?.name || '';
      return role.toLowerCase() === 'admin' || 
             hasPermission(user, 'manage_all') || 
             hasPermission(user, 'manage_roles');
    },
    isManagerOrHigher: () => {
      const role = user?.role?.name || '';
      return ['admin', 'manager'].includes(role.toLowerCase()) || 
             hasPermission(user, 'manage_all');
    },
  };
};
