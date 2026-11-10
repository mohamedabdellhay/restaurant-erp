# Frontend Guide: Dynamic Roles & Permissions

This guide explains how to integrate the dynamic permissions system into the frontend application.

## 1. How Permissions Work

Every staff member is assigned a **Role**. A Role contains a list of **Permissions** (strings).
The backend enforces these permissions, but the frontend must also use them to provide a smooth User Experience (e.g., hiding buttons, locking routes).

## 2. Getting User Permissions

When the user logs in or when you fetch their profile (`GET /api/auth/me`), the response includes the `role` object:

```json
{
  "success": true,
  "data": {
    "_id": "65d...",
    "name": "John Doe",
    "role": {
      "_id": "65e...",
      "name": "Manager",
      "permissions": [
        "view_staff",
        "view_menu",
        "manage_menu",
        "view_orders"
      ]
    }
  }
}
```

## 3. Recommended Frontend Implementation

### A. Permission Helper (React Example)
We recommend creating a helper function or hook to check permissions.

```javascript
const hasPermission = (user, permission) => {
  return user?.role?.permissions?.includes(permission);
};

// Usage
{hasPermission(user, 'manage_menu') && (
  <button onClick={handleAddProduct}>Add Product</button>
)}
```

### B. High-Order Component / Wrapper
```javascript
const ProtectedElement = ({ permission, children }) => {
  const { user } = useAuth();
  if (!user?.role?.permissions?.includes(permission)) return null;
  return children;
};

// Usage
<ProtectedElement permission="view_reports">
  <RevenueChart />
</ProtectedElement>
```

## 4. Permission Metadata for UI Organization

To build a better UI (like grouping permissions by module in a roles table), use the dedicated metadata endpoint:

1. **Fetch Permission Metadata**: `GET /api/permissions/metadata`
   - Returns permissions grouped by module (e.g., Staff Management, Menu, Financials).
   - Each item includes a `key` (backend string) and a user-friendly `label`.

```json
[
  {
    "module": "Staff Management",
    "description": "Control staff access and roles",
    "permissions": [
      { "key": "view_staff", "label": "View Staff" },
      { "key": "manage_staff", "label": "Manage Staff" }
    ]
  }
]
```

## 5. Role Management UI

For the Admin/Manager dashboard, you can now build a UI to create custom roles:

1. **Fetch All Permissions**: Use the metadata endpoint above (`GET /api/permissions/metadata`) to populate a grouped list of checkboxes.
2. **Create/Update Role**: `POST /api/roles` or `PUT /api/roles/:id`
   - Payload: `{ "name": "Floor Manager", "permissions": ["view_orders", "manage_tables", ...] }`


## 5. Summary Table

| UI Component | Required Permission |
| :--- | :--- |
| Staff Management Page | `view_staff` |
| Add/Edit Staff Button | `manage_staff` |
| Menu Editor | `manage_menu` |
| Inventory Dashboard | `view_inventory` |
| Reports/Analytics | `view_reports` |
| Order Deletion | `manage_orders` |

---
*For any questions regarding permission strings, refer to `docs/user_roles.txt`.*
