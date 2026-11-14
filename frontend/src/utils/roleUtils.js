import React from "react";

/**
 * Role-based UI component that conditionally renders children based on user roles
 */
export const RoleBasedUI = ({
  user,
  allowedRoles = [],
  children,
  fallback = null,
}) => {
  if (!user) return fallback;

  if (allowedRoles.length === 0) return children;

  const userRole = String(user?.role?.name || user?.role || "").toLowerCase();
  const allowed = allowedRoles.map((role) => String(role).toLowerCase());
  return allowed.includes(userRole) ? children : fallback;
};

/**
 * Higher-order component for role-based rendering
 */
export const withRoleProtection = (Component, allowedRoles = []) => {
  return (props) => {
    const { user } = props.auth || {};

    if (!user) {
      return React.createElement(
        "div",
        null,
        "Please log in to access this feature.",
      );
    }

    const userRole = String(user?.role?.name || user?.role || "").toLowerCase();
    const allowed = allowedRoles.map((role) => String(role).toLowerCase());
    if (allowed.length > 0 && !allowed.includes(userRole)) {
      return React.createElement(
        "div",
        null,
        "You don't have permission to access this feature.",
      );
    }

    return React.createElement(Component, props);
  };
};

/**
 * Hook for role-based permissions
 */
export const useRolePermissions = () => {
  const permissions = {
    // Staff Management
    canManageStaff: (user) => (user?.role?.name || user?.role) === "admin",
    canViewStaff: (user) => ["admin", "manager"].includes(user?.role?.name || user?.role),
    canToggleStaffStatus: (user) => (user?.role?.name || user?.role) === "admin",

    // Dashboard & Analytics
    canViewDashboard: (user) => ["admin", "manager"].includes(user?.role?.name || user?.role),
    canViewAnalytics: (user) => ["admin", "manager"].includes(user?.role?.name || user?.role),
    canViewRealTimeMetrics: (user) => ["admin", "manager"].includes(user?.role?.name || user?.role),
    canViewInventoryAlerts: (user) => ["admin", "manager"].includes(user?.role?.name || user?.role),

    // Customers
    canViewAllCustomers: (user) => ["admin", "manager"].includes(user?.role?.name || user?.role),
    canSearchCustomers: (user) => !!user, // Any logged-in staff
    canCreateUpdateCustomer: (user) => !!user, // Any logged-in staff
    canDeleteCustomer: (user) => (user?.role?.name || user?.role) === "admin",

    // Reservations
    canViewAllReservations: (user) => ["admin", "manager"].includes(user?.role),
    canCreateReservation: (user) => ["admin", "manager"].includes(user?.role),
    canUpdateReservation: (user) => ["admin", "manager"].includes(user?.role),
    canDeleteReservation: (user) => user?.role === "admin",

    // Orders & POS
    canViewOrders: (user) => !!user, // Any logged-in staff
    canCreateOrder: (user) => !!user, // Any logged-in staff
    canUpdateOrder: (user) => !!user, // Any logged-in staff
    canDeleteOrder: (user) => !!user, // Any logged-in staff (for error correction)

    // Inventory & Suppliers
    canViewInventory: (user) => !!user, // Any logged-in staff
    canManageInventory: (user) => !!user, // Any logged-in staff
    canViewSuppliers: (user) => !!user, // Any logged-in staff
    canManageSuppliers: (user) => !!user, // Any logged-in staff

    // Menu
    canViewMenu: (user) =>
      ["cashier", "waiter", "admin", "manager", "chef"].includes(user?.role?.name || user?.role),
    canManageMenu: (user) => ["admin", "manager"].includes(user?.role?.name || user?.role),

    // Tables
    canViewTables: (user) =>
      ["cashier", "waiter", "admin", "manager"].includes(user?.role),
    canManageTables: (user) => ["admin", "manager"].includes(user?.role),

    // Settings
    canAccessSettings: (user) => user?.role === "admin",
    canManageSystemSettings: (user) => user?.role === "admin",
  };

  return {
    hasPermission: (permission, user) => {
      return permissions[permission]?.(user) || false;
    },
    permissions,
  };
};

export default { RoleBasedUI, withRoleProtection, useRolePermissions };
