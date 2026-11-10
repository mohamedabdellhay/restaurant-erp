# Restaurant ERP - Department API Documentation

This document provides technical details for the Department management API. Departments are used to categorize staff members and organize restaurant operations.

## Base URL
`/api/departments`

## Authentication
All endpoints require a Bearer Token (`Authorization: Bearer <token>`).
User must have `view_departments` permission for read operations and `manage_departments` for write operations.

---

## 1. Data Model: Department

| Field | Type | Description | Required | Role |
| :--- | :--- | :--- | :--- | :--- |
| `name` | String | Department name | Yes | Input/Output |
| `description` | String | Department description | No | Input/Output |
| `restaurant` | ID | Reference to the Restaurant | Yes | Input/Output |
| `isSystemDepartment`| Boolean| Flag for system-defined departments | No | Output (Default: false) |

---

## 2. Endpoints

### 2.1 Get All Departments
- **Endpoint:** `GET /`
- **Permission:** `view_departments`
- **Description:** Returns all departments for the authenticated user's restaurant.
- **Success Response:** `200 OK`

### 2.2 Get Single Department
- **Endpoint:** `GET /:id`
- **Permission:** `view_departments`
- **Description:** Returns detailed information for a specific department.
- **Success Response:** `200 OK`

### 2.3 Create Department
- **Endpoint:** `POST /`
- **Permission:** `manage_departments`
- **Request Body:**
  ```json
  {
    "name": "Kitchen",
    "description": "Food preparation and cooking"
  }
  ```
- **Success Response:** `201 Created`

### 2.4 Update Department
- **Endpoint:** `PUT /:id`
- **Permission:** `manage_departments`
- **Request Body:** Standard `Department` fields.
- **Success Response:** `200 OK`

### 2.5 Delete Department
- **Endpoint:** `DELETE /:id`
- **Permission:** `manage_departments`
- **Description:** Deletes a department.
- **Success Response:** `200 OK`

---

## 3. Staff Association

To assign a staff member to a department, use the `department` field in the Staff API.

### 3.1 Create Staff with Department
- **Endpoint:** `POST /api/staff`
- **Payload:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "ROLE_ID",
    "department": "DEPARTMENT_ID"
  }
  ```

---

## 4. Standard Response Format
All responses follow the project's standard structure:
```json
{
  "success": true,
  "message": "Status message",
  "data": { ... }
}
```
