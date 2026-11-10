import React from "react";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from "@utils/permissionUtils";
import { useAuth } from "@hooks/useAuth";

/**
 * Component that conditionally renders children based on user permissions
 *
 * @param {Object} props
 * @param {string|string[]} props.permission - Permission(s) required
 * @param {'any'|'all'} props.require - Whether user needs any or all permissions
 * @param {React.ReactNode} props.children - Children to render if user has permission
 * @param {React.ReactNode} props.fallback - Optional fallback to render if no permission
 * @param {boolean} props.hideOnNoPermission - If true, render nothing when no permission (default: true)
 */
export const PermissionGuard = ({
  permission,
  require = "any",
  children,
  fallback = null,
  hideOnNoPermission = true,
}) => {
  const { user } = useAuth();

  if (!user) {
    return hideOnNoPermission ? null : fallback;
  }

  let hasRequiredPermission = false;

  if (Array.isArray(permission)) {
    hasRequiredPermission =
      require === "all"
        ? hasAllPermissions(user, permission)
        : hasAnyPermission(user, permission);
  } else {
    hasRequiredPermission = hasPermission(user, permission);
  }

  if (hasRequiredPermission) {
    return children;
  }

  return hideOnNoPermission ? null : fallback;
};

/**
 * Legacy RoleBasedUI component for backward compatibility
 * @deprecated Use PermissionGuard instead
 */
export const RoleBasedUI = ({ allowedRoles, children, fallback = null }) => {
  const { user } = useAuth();

  if (!user || !user.role) {
    return fallback;
  }

  const userRole = (user.role?.name || user.role || "").toLowerCase();
  const hasRequiredRole = allowedRoles.some(
    (role) => role.toLowerCase() === userRole,
  );

  return hasRequiredRole ? children : fallback;
};

export default PermissionGuard;
