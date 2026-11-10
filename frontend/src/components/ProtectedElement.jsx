import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

/**
 * ProtectedElement - Conditionally renders children based on user permissions
 * 
 * @param {Object} props
 * @param {string|string[]} props.permission - Required permission(s) to render children
 * @param {'any'|'all'} props.require - Whether user needs 'any' or 'all' permissions (default: 'any')
 * @param {React.ReactNode} props.children - Children to render if user has permission
 * @param {React.ReactNode} props.fallback - Optional fallback to render if no permission
 * @param {boolean} props.hide - If true, completely hide element (default: true). If false, show disabled.
 * @returns {React.ReactNode}
 */
export const ProtectedElement = ({ 
  permission, 
  require = 'any', 
  children, 
  fallback = null, 
  hide = true,
  ...props 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  // Check if user has required permissions
  let hasRequiredPermission = false;
  
  if (Array.isArray(permission)) {
    if (require === 'all') {
      hasRequiredPermission = hasAllPermissions(permission);
    } else {
      hasRequiredPermission = hasAnyPermission(permission);
    }
  } else {
    hasRequiredPermission = hasPermission(permission);
  }

  // If user has permission, render children
  if (hasRequiredPermission) {
    return <>{children}</>;
  }

  // If no permission and hide is true, render fallback (default null)
  if (hide) {
    return <>{fallback}</>;
  }

  // If hide is false, render disabled version
  return (
    <div 
      className="opacity-50 cursor-not-allowed" 
      title="You don't have permission to access this feature"
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * ProtectedButton - A button that is conditionally rendered or disabled based on permissions
 */
export const ProtectedButton = ({ 
  permission, 
  require = 'any', 
  children, 
  disabled: propDisabled = false,
  ...props 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  // Check if user has required permissions
  let hasRequiredPermission = false;
  
  if (Array.isArray(permission)) {
    if (require === 'all') {
      hasRequiredPermission = hasAllPermissions(permission);
    } else {
      hasRequiredPermission = hasAnyPermission(permission);
    }
  } else {
    hasRequiredPermission = hasPermission(permission);
  }

  const isDisabled = propDisabled || !hasRequiredPermission;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`
        ${props.className || ''}
        ${!hasRequiredPermission ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      title={
        !hasRequiredPermission 
          ? "You don't have permission to perform this action" 
          : props.title
      }
    >
      {children}
    </button>
  );
};

/**
 * ProtectedRoute - Higher-order component for protecting routes
 */
export const ProtectedRoute = ({ 
  permission, 
  require = 'any',
  children, 
  fallback = <div className="p-4 text-center">Access Denied</div>
}) => {
  return (
    <ProtectedElement 
      permission={permission} 
      require={require}
      fallback={fallback}
    >
      {children}
    </ProtectedElement>
  );
};

export default ProtectedElement;
