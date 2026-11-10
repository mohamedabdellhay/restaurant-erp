# Frontend API Integration Guide

This document provides essential information for frontend developers integrating with the **Restaurant ERP API**.

## Authentication & Security

### Bearer Token
All endpoints (except Public/Guest routes) require a **JSON Web Token (JWT)** for authentication.
- **Header**: `Authorization: Bearer <your_token>`
- **Public Routes**: Only `POST /api/auth/login` and `POST /api/reservations/request` (for guests) are public.

### Multi-Tenant Isolation
The API implements automatic multi-tenant isolation. 
- **Automatic Scoping**: You do **not** need to pass a `restaurantId` in your GET/PUT/PATCH/DELETE requests. The backend automatically extracts the restaurant context from your authenticated user token.
- **What this means for you**: When you call `GET /api/menu`, you will only receive items for the restaurant associated with your token.

## API Documentation (Swagger)

A full interactive Swagger documentation is available at:
**[http://your-server-url/api-docs](http://your-server-url/api-docs)**

*Note: Use the "Authorize" button in Swagger to enter your token for testing protected endpoints.*

## Key API Changes (Recent Update)

### 1. Scoped Uniqueness
Models like `Category`, `Table`, `Supplier`, and `InventoryItem` now support identical names across different restaurants. However, they remain unique within the same restaurant.

### 2. New Response Fields
Many models now include a `restaurant` ID field and standard timestamps for consistency.
- `restaurant`: ObjectId of the restaurant owner.
- `createdAt` / `updatedAt`: ISO 8601 timestamps.

### 3. Image URLs
The API now automatically appends the `BASE_URL` to image paths for Menu Items and Restaurant Logos. You can use the `image` field directly in `<img>` tags.

## Core Modules

| Module | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `/auth` | Public/Protected | Login, Register, Logout, Profile |
| **Menu** | `/menu` | Protected | Manage menu items |
| **Categories** | `/categories` | Protected | Grouping for menu items ([Guide](file:///home/mohamedabdellhay/work/projects/restaurant-erp-api/docs/FE_CATEGORY_GUIDE.md)) |
| **Orders** | `/orders` | Protected | POS operations, dine-in/takeaway |
| **Invoices** | `/invoices` | Protected | Billing and PDF generation |
| **Inventory** | `/inventory` | Protected | Stock management and Suppliers |
| **Roles** | `/roles` | Protected | Dynamic roles and permissions ([Guide](./FE_ROLES_GUIDE.md)) |
| **Permissions** | `/permissions`| Protected | Grouped permission metadata for UI organization |
| **Staff** | `/staff` | Protected (Permission-based) | User management |
| **Customers** | `/customers` | Protected | Customer directory |
| **Reservations** | `/reservations`| Protected/Guest | Table booking management |
| **Dashboard** | `/dashboard` | Admin/Manager | Business analytics and real-time stats |

## Common Error Codes

- `401 Unauthorized`: Token is missing, expired, or invalid.
- `403 Forbidden`: You don't have the required role (e.g., trying to access `/staff` as a Waiter).
- `404 Not Found`: The resource doesn't exist or doesn't belong to your restaurant.
- `422 Unprocessable Entity`: Validation failed (check the `errors` array in response).

---
*For any questions or integration support, please contact the backend team.*
