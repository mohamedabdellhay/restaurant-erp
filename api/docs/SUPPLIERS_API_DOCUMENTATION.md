# Restaurant ERP - Suppliers API Documentation

This document provides technical details for the Suppliers management API.

## Base URL
`/api/inventory/suppliers`

## Authentication
All endpoints require a Bearer Token (`Authorization: Bearer <token>`).

---

## 1. Data Model: Supplier

| Field | Type | Description | Required |
| :--- | :--- | :--- | :--- |
| `name` | String | Company or Supplier Name | Yes |
| `contactPerson` | String | Name of the primary contact | No |
| `phone` | String | Primary phone number | Yes |
| `email` | String | Email address | No |
| `address` | Object | Nested object: `{ street, city, state, country, zip }` | No |
| `paymentTerms` | String | `cash`, `credit`, or `installment` | No (Default: `cash`) |
| `balance` | Number | Outstanding balance (read-only) | No (Default: `0`) |
| `notes` | String | Additional information | No |
| `isActive` | Boolean | Status of the supplier | No (Default: `true`) |

---

## 2. Endpoints

### 2.1 Get All Suppliers
- **Endpoint:** `GET /`
- **Description:** Returns a list of all suppliers for the authenticated restaurant.
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Suppliers retrieved successfully",
    "data": [
      {
        "_id": "...",
        "name": "Global Supplies",
        "balance": 500,
        ...
      }
    ]
  }
  ```

### 2.2 Create New Supplier
- **Endpoint:** `POST /`
- **Request Body:** `Supplier` object.
- **Success Response:** `201 Created`

### 2.3 Get Single Supplier
- **Endpoint:** `GET /:id`
- **Success Response:** `200 OK`

### 2.4 Update Supplier
- **Endpoint:** `PUT /:id`
- **Request Body:** Partial or full `Supplier` object.
- **Success Response:** `200 OK`

### 2.5 Delete Supplier
- **Endpoint:** `DELETE /:id`
- **Description:** Removes the supplier from the system.
- **Success Response:** `200 OK`

### 2.6 Record Supplier Payment
- **Endpoint:** `POST /:id/payments`
- **Description:** Deducts an amount from the supplier's balance and records a transaction.
- **Request Body:**
  ```json
  {
    "amount": 1000,
    "description": "Partial payment for last invoice"
  }
  ```
- **Success Response:** `201 Created`

### 2.7 Get Account Statement
- **Endpoint:** `GET /:id/statement`
- **Description:** Returns the current balance and a chronological list of all transactions (purchases, payments, adjustments).
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "supplier": { "name": "...", "balance": 1500 },
      "transactions": [
        {
          "type": "payment",
          "amount": 1000,
          "description": "...",
          "createdAt": "..."
        },
        ...
      ]
    }
  }
  ```
