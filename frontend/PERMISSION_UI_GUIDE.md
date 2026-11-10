# Permission-Based UI Implementation Guide

## Quick Start

### 1. Import Required Components
```jsx
import { ProtectedElement, ProtectedButton } from "@components/ProtectedElement";
import { PERMISSIONS } from "@utils/permissionUtils";
import { usePermissions } from "@hooks/usePermissions";
```

### 2. Protect Buttons
```jsx
<ProtectedButton
  permission={PERMISSIONS.MANAGE_ORDERS}
  onClick={handleDelete}
  className="btn-delete"
>
  Delete Order
</ProtectedButton>
```

### 3. Protect Elements
```jsx
<ProtectedElement permission={PERMISSIONS.VIEW_REPORTS}>
  <RevenueChart />
</ProtectedElement>
```

### 4. Protect Routes
```jsx
<ProtectedRoute permission={PERMISSIONS.MANAGE_STAFF}>
  <StaffPage />
</ProtectedRoute>
```

### 5. Use in Components
```jsx
const { hasPermission, isAdmin } = usePermissions();

{hasPermission('manage_menu') && <EditButton />}
{isAdmin() && <AdminPanel />}
```

## Available Permissions
- `VIEW_STAFF`, `MANAGE_STAFF`
- `VIEW_MENU`, `MANAGE_MENU`
- `VIEW_ORDERS`, `MANAGE_ORDERS`
- `VIEW_INVENTORY`, `MANAGE_INVENTORY`
- `VIEW_REPORTS`
- `MANAGE_SETTINGS`, `MANAGE_ROLES`

## Examples Updated
- ✅ Orders page - protected edit/delete buttons
- ✅ Staff page - protected all CRUD operations
- ✅ Header - fixed role display issue
- ✅ AuthContext - added permission methods
- ✅ ProtectedRoute - enhanced with permission checks
