# Frontend Integration Guide: ERP API & Roles

This document is the primary reference for frontend developers integrating with the Restaurant ERP API.

## 1. Authentication

All requests (except login) must include the JWT token in the `Authorization` header.

- **Header**: `Authorization: Bearer <TOKEN>`
- **Cookie**: The API also sets a `token` cookie for SSR/Browser compatibility.

## 2. API Architecture

### Multi-Tenancy
The API is multi-tenant. You **do not** need to pass a `restaurantId` in your requests. The backend automatically scopes all data (Menu, Orders, Staff, etc.) based on the user's token.

### Base URLs for Images
Image paths (logos, menu items) are returned as relative paths. The backend `BASE_URL` should be used as a prefix if it's not already absolute.
*Note: The latest update already appends the BASE_URL to most image fields.*

## 3. Dynamic Roles & Permissions

The system uses a granular permissions model. Each user has a `role` object containing an array of `permissions`.

### Checking Permissions
**Do not hardcode role names (e.g., "Admin") in the UI for access control.** Instead, check for specific permission strings.

```javascript
// Example helper
const canManageMenu = user.role.permissions.includes('manage_menu');
```

### Available Permission Keys
| Category | Permissions |
| :--- | :--- |
| **Staff** | `view_staff`, `manage_staff` |
| **Menu** | `view_menu`, `manage_menu`, `view_categories`, `manage_categories` |
| **Orders** | `view_orders`, `manage_orders` |
| **Inventory**| `view_inventory`, `manage_inventory` |
| **Billing** | `view_invoices`, `manage_invoices` |
| **Admin** | `manage_settings`, `view_roles`, `manage_roles`, `view_reports` |

## 4. Key Endpoints for Frontend

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/auth/me` | Current user profile, restaurant info, and **permissions**. |
| `GET` | `/api/roles/permissions` | List all available system permissions (for Admin role-creation UI). |
| `GET` | `/api/roles` | List roles available for the current restaurant. |

## 5. Error Handling

- `401 Unauthorized`: Token expired or missing. Redirect to login.
- `403 Forbidden`: User has the correct account but lacks the **specific permission** for that action.
- `422 Unprocessable Entity`: Validation failure. The response will contain an `errors` array.

---
### Detailed Guides
- [API Swagger Documentation](http://localhost:3000/api/docs)
- [How to implement Role UI Controls](./FE_ROLES_GUIDE.md)
- [Staff Management (Create/Edit Staff)](./FE_STAFF_MANAGEMENT_GUIDE.md)
- [Department Management Guide](./walkthrough_departments.md)
- [General API Readme](./FRONTEND_API_README.md)
