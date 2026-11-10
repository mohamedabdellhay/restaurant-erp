import { PERMISSIONS } from "./permissions.js";

/**
 * Grouped permissions for frontend UI rendering and organization.
 * This structure helps the frontend know which permissions belong to which module.
 */
export const FRONTEND_PERMISSION_GROUPS = [
    {
        module: "Dashboard",
        description: "Access to business analytics and overview",
        permissions: [
            { key: PERMISSIONS.VIEW_DASHBOARD, label: "View Dashboard" },
        ],
    },
    {
        module: "Staff Management",
        description: "Control staff access and roles",
        permissions: [
            { key: PERMISSIONS.VIEW_STAFF, label: "View Staff" },
            { key: PERMISSIONS.MANAGE_STAFF, label: "Manage Staff" },
            { key: PERMISSIONS.VIEW_ROLES, label: "View Roles" },
            { key: PERMISSIONS.MANAGE_ROLES, label: "Manage Roles" },
            { key: PERMISSIONS.VIEW_DEPARTMENTS, label: "View Departments" },
            { key: PERMISSIONS.MANAGE_DEPARTMENTS, label: "Manage Departments" },
        ],
    },
    {
        module: "Menu & Categories",
        description: "Manage restaurant offerings",
        permissions: [
            { key: PERMISSIONS.VIEW_MENU, label: "View Menu" },
            { key: PERMISSIONS.MANAGE_MENU, label: "Manage Menu" },
            { key: PERMISSIONS.VIEW_CATEGORIES, label: "View Categories" },
            { key: PERMISSIONS.MANAGE_CATEGORIES, label: "Manage Categories" },
        ],
    },
    {
        module: "Inventory",
        description: "Track stock and supplies",
        permissions: [
            { key: PERMISSIONS.VIEW_INVENTORY, label: "View Inventory" },
            { key: PERMISSIONS.MANAGE_INVENTORY, label: "Manage Inventory" },
        ],
    },
    {
        module: "Orders & Tables",
        description: "Handle dining operations",
        permissions: [
            { key: PERMISSIONS.VIEW_ORDERS, label: "View Orders" },
            { key: PERMISSIONS.MANAGE_ORDERS, label: "Manage Orders" },
            { key: PERMISSIONS.VIEW_TABLES, label: "View Tables" },
            { key: PERMISSIONS.MANAGE_TABLES, label: "Manage Tables" },
        ],
    },
    {
        module: "Reservations",
        description: "Manage table bookings",
        permissions: [
            { key: PERMISSIONS.VIEW_RESERVATIONS, label: "View Reservations" },
            { key: PERMISSIONS.MANAGE_RESERVATIONS, label: "Manage Reservations" },
        ],
    },
    {
        module: "Financials",
        description: "Invoices and financial reports",
        permissions: [
            { key: PERMISSIONS.VIEW_INVOICES, label: "View Invoices" },
            { key: PERMISSIONS.MANAGE_INVOICES, label: "Manage Invoices" },
            { key: PERMISSIONS.VIEW_REPORTS, label: "View Reports" },
        ],
    },
    {
        module: "Customers",
        description: "Manage customer relationships",
        permissions: [
            { key: PERMISSIONS.VIEW_CUSTOMERS, label: "View Customers" },
            { key: PERMISSIONS.MANAGE_CUSTOMERS, label: "Manage Customers" },
        ],
    },
    {
        module: "Settings",
        description: "General restaurant configurations",
        permissions: [
            { key: PERMISSIONS.MANAGE_SETTINGS, label: "Manage Settings" },
        ],
    },
];

export const ALL_FRONTEND_PERMISSIONS = FRONTEND_PERMISSION_GROUPS.reduce(
    (acc, group) => [...acc, ...group.permissions],
    [],
);
