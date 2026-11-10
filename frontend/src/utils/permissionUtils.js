/**
 * Permission Utilities for Dynamic Role-Based Access Control
 *
 * This file provides helper functions and components to check user permissions
 * and conditionally render UI elements based on those permissions.
 *
 * Updated to match the new dynamic roles and permissions system documentation.
 */

/**
 * Check if user has a specific permission
 * @param {Object} user - User object with role.permissions array
 * @param {string} permission - Permission string to check
 * @returns {boolean} - True if user has permission
 */
export const hasPermission = (user, permission) => {
  return user?.role?.permissions?.includes(permission) || false;
};

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - User object with role.permissions array
 * @param {string[]} permissions - Array of permission strings
 * @returns {boolean} - True if user has any of the permissions
 */
export const hasAnyPermission = (user, permissions) => {
  if (!user?.role?.permissions || !permissions.length) return false;
  return permissions.some((permission) =>
    user.role.permissions.includes(permission),
  );
};

/**
 * Check if user has all of the specified permissions
 * @param {Object} user - User object with role.permissions array
 * @param {string[]} permissions - Array of permission strings
 * @returns {boolean} - True if user has all permissions
 */
export const hasAllPermissions = (user, permissions) => {
  if (!user?.role?.permissions || !permissions.length) return false;
  return permissions.every((permission) =>
    user.role.permissions.includes(permission),
  );
};

/**
 * Get user's role name
 * @param {Object} user - User object with role.name
 * @returns {string} - Role name or 'Unknown'
 */
export const getUserRole = (user) => {
  return user?.role?.name || "Unknown";
};

/**
 * Check if user is admin (has admin role or specific admin permissions)
 * @param {Object} user - User object with role
 * @returns {boolean} - True if user is admin
 */
export const isAdmin = (user) => {
  return (
    getUserRole(user).toLowerCase() === "admin" ||
    hasPermission(user, "manage_settings") ||
    hasPermission(user, "manage_roles")
  );
};

/**
 * Check if user is manager or higher
 * @param {Object} user - User object with role
 * @returns {boolean} - True if user is manager or admin
 */
export const isManagerOrHigher = (user) => {
  const role = getUserRole(user).toLowerCase();
  return role === "admin" || role === "manager" || isAdmin(user);
};

/**
 * Check if user is owner (top-level access)
 * @param {Object} user - User object with role
 * @returns {boolean} - True if user is owner
 */
export const isOwner = (user) => {
  return getUserRole(user).toLowerCase() === "owner";
};

/**
 * Permission constants for easy reference
 * Updated to match the new dynamic permissions system documentation
 */
export const PERMISSIONS = {
  // Staff Management
  VIEW_STAFF: "view_staff",
  MANAGE_STAFF: "manage_staff",

  // Menu Management
  VIEW_MENU: "view_menu",
  MANAGE_MENU: "manage_menu",
  VIEW_CATEGORIES: "view_categories",
  MANAGE_CATEGORIES: "manage_categories",

  // Inventory Management
  VIEW_INVENTORY: "view_inventory",
  MANAGE_INVENTORY: "manage_inventory",

  // Order Management
  VIEW_ORDERS: "view_orders",
  MANAGE_ORDERS: "manage_orders",

  // Table Management
  VIEW_TABLES: "view_tables",
  MANAGE_TABLES: "manage_tables",

  // Customer Management
  VIEW_CUSTOMERS: "view_customers",
  MANAGE_CUSTOMERS: "manage_customers",

  // Reservation Management
  VIEW_RESERVATIONS: "view_reservations",
  MANAGE_RESERVATIONS: "manage_reservations",

  // Supplier Management
  VIEW_SUPPLIERS: "view_suppliers",
  MANAGE_SUPPLIERS: "manage_suppliers",

  // Reports & Analytics
  VIEW_REPORTS: "view_reports",

  // Financial Management
  VIEW_INVOICES: "view_invoices",
  MANAGE_INVOICES: "manage_invoices",

  // System Administration
  MANAGE_SETTINGS: "manage_settings",
  VIEW_ROLES: "view_roles",
  MANAGE_ROLES: "manage_roles",

  // Dashboard Access
  VIEW_DASHBOARD: "view_dashboard",

  // Point of Sale
  USE_POS: "use_pos",

  // Kitchen Display
  VIEW_KITCHEN: "view_kitchen",

  // Department Management
  VIEW_DEPARTMENTS: "view_departments",
  MANAGE_DEPARTMENTS: "manage_departments",
};

/**
 * Default role permissions according to the documentation
 * These are the auto-seeded roles for every restaurant
 */
export const DEFAULT_ROLE_PERMISSIONS = {
  OWNER: [
    // All permissions - top-level access
    PERMISSIONS.VIEW_STAFF,
    PERMISSIONS.MANAGE_STAFF,
    PERMISSIONS.VIEW_MENU,
    PERMISSIONS.MANAGE_MENU,
    PERMISSIONS.VIEW_CATEGORIES,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.MANAGE_ORDERS,
    PERMISSIONS.VIEW_TABLES,
    PERMISSIONS.MANAGE_TABLES,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.MANAGE_CUSTOMERS,
    PERMISSIONS.VIEW_RESERVATIONS,
    PERMISSIONS.MANAGE_RESERVATIONS,
    PERMISSIONS.VIEW_SUPPLIERS,
    PERMISSIONS.MANAGE_SUPPLIERS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.MANAGE_INVOICES,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.VIEW_ROLES,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.VIEW_DEPARTMENTS,
    PERMISSIONS.MANAGE_DEPARTMENTS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.USE_POS,
    PERMISSIONS.VIEW_KITCHEN,
  ],

  ADMIN: [
    // Full system access (includes all permissions)
    PERMISSIONS.VIEW_STAFF,
    PERMISSIONS.MANAGE_STAFF,
    PERMISSIONS.VIEW_MENU,
    PERMISSIONS.MANAGE_MENU,
    PERMISSIONS.VIEW_CATEGORIES,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.MANAGE_ORDERS,
    PERMISSIONS.VIEW_TABLES,
    PERMISSIONS.MANAGE_TABLES,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.MANAGE_CUSTOMERS,
    PERMISSIONS.VIEW_RESERVATIONS,
    PERMISSIONS.MANAGE_RESERVATIONS,
    PERMISSIONS.VIEW_SUPPLIERS,
    PERMISSIONS.MANAGE_SUPPLIERS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.MANAGE_INVOICES,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.VIEW_ROLES,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.VIEW_DEPARTMENTS,
    PERMISSIONS.MANAGE_DEPARTMENTS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.USE_POS,
    PERMISSIONS.VIEW_KITCHEN,
  ],

  MANAGER: [
    // High administrative access
    PERMISSIONS.VIEW_STAFF,
    PERMISSIONS.MANAGE_STAFF,
    PERMISSIONS.VIEW_MENU,
    PERMISSIONS.MANAGE_MENU,
    PERMISSIONS.VIEW_CATEGORIES,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.MANAGE_ORDERS,
    PERMISSIONS.VIEW_TABLES,
    PERMISSIONS.MANAGE_TABLES,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.MANAGE_CUSTOMERS,
    PERMISSIONS.VIEW_RESERVATIONS,
    PERMISSIONS.MANAGE_RESERVATIONS,
    PERMISSIONS.VIEW_SUPPLIERS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.VIEW_DEPARTMENTS,
    PERMISSIONS.MANAGE_DEPARTMENTS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.USE_POS,
    PERMISSIONS.VIEW_KITCHEN,
  ],

  CASHIER: [
    // POS operations
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.MANAGE_ORDERS,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.USE_POS,
  ],

  CHEF: [
    // Kitchen operations
    PERMISSIONS.VIEW_MENU,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.VIEW_KITCHEN,
  ],

  WAITER: [
    // Floor service
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.VIEW_TABLES,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.VIEW_RESERVATIONS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.USE_POS,
  ],
};

/**
 * Helper function to get permissions for a role name
 * @param {string} roleName - Name of the role
 * @returns {string[]} - Array of permissions for the role
 */
export const getRolePermissions = (roleName) => {
  const upperRoleName = roleName.toUpperCase();
  return DEFAULT_ROLE_PERMISSIONS[upperRoleName] || [];
};

/**
 * Helper function to check if a role is a system role (cannot be edited/deleted)
 * @param {Object} role - Role object
 * @returns {boolean} - True if role is a system role
 */
export const isSystemRole = (role) => {
  const systemRoles = [
    "OWNER",
    "ADMIN",
    "MANAGER",
    "CASHIER",
    "CHEF",
    "WAITER",
  ];
  return systemRoles.includes(role?.name?.toUpperCase());
};
