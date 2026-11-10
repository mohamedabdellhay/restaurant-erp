# API Guide: Creating & Editing Staff (Post-Role Update)

With the new dynamic role system, the way you create and update staff members has changed. The `role` field is no longer a simple string; it is now an **ObjectId** referencing a specific Role document.

## 1. How to Create a Staff Member

To create a staff member, you first need to know which roles are available for the restaurant.

### Step 1: Fetch Available Roles
Call the roles endpoint to get the list of roles and their IDs.

**Request:** `GET /api/roles`

**Response Example:**
```json
{
  "success": true,
  "data": [
    { "_id": "65d...", "name": "Manager", "isSystemRole": true },
    { "_id": "65e...", "name": "Head Chef", "isSystemRole": false }
  ]
}
```

### Step 2: Create Staff with Role ID
Use the `_id` from the previous step in your POST request.

**Endpoint:** `POST /api/staff`

**Payload:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePassword123!",
  "phone": "0123456789",
  "role": "65d..." // Use the Role ObjectId here
}
```

## 2. How to Update a Staff Member

The same applies when updating an existing staff member.

**Endpoint:** `PUT /api/staff/:id`

**Payload:**
```json
{
  "name": "Jane Smith",
  "role": "65e..." // Update to a different Role ObjectId
}
```

## 3. Important Notes

- **Validation**: If you send a string like "admin" instead of a valid MongoDB ObjectId, the API will return a `400 Bad Request` with a validation error.
- **Role Scoping**: Only roles belonging to the same restaurant as the staff member can be assigned.
- **Owner Role**: Be careful when assigning the "Owner" role, as it has unrestricted access and cannot be modified or deleted.

---
*Refer to the main [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md) for more details on the permission system.*
