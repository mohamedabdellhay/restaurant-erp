# Restaurant ERP - Menu API Documentation

This document provides technical details for the Menu management API, highlighting the integration with the Inventory system for dynamic stock-based availability.

## Base URL
`/api/menu`

## Authentication
All endpoints require a Bearer Token (`Authorization: Bearer <token>`).

---

## 1. Data Model: MenuItem

| Field | Type | Description | Required | Role |
| :--- | :--- | :--- | :--- | :--- |
| `name` | String | Item name | Yes | Input/Output |
| `description` | String | Item description | No | Input/Output |
| `image` | String | Full URL to the item image | No | Output (Processed) |
| `category` | Object/ID | Category details or ID | Yes | Input/Output |
| `price` | Number | Selling price | Yes | Input/Output |
| `isActive` | Boolean | Administrative toggle for the item | No | Input/Output |
| `recipe` | Array | Ingredients required (see below) | No | Input/Output |
| `isAvailable` | Boolean | **Computed:** true if `isActive` and stock is sufficient | - | Output Only |

### 1.1 Recipe Object structure
Each entry in the `recipe` array links a menu item to the inventory:
```json
{
  "inventoryItem": "67b79a...", // ObjectId referencing InventoryItem
  "qty": 0.5                     // Amount required per portion
}
```

---

## 2. Endpoints

### 2.1 Get All Menu Items
- **Endpoint:** `GET /`
- **Query Parameters:**
  - `category`: Filter items by category ID.
- **Description:** Returns all menu items. The `isAvailable` field is calculated in real-time by checking the stock of each item in the `recipe`.
- **Success Response:** `200 OK`

### 2.2 Get Single Menu Item
- **Endpoint:** `GET /:id`
- **Description:** Returns detailed information for a specific menu item, including its full recipe details.

### 2.3 Create Menu Item
- **Endpoint:** `POST /`
- **Request Body:** Standard `MenuItem` object.
- **Success Response:** `201 Created`

### 2.4 Update Menu Item
- **Endpoint:** `PUT /:id`
- **Description:** Updates item details. If the recipe is changed, `isAvailable` will be recalculated on the next retrieval.

### 2.4 Get Menu Item Recipe
- **Endpoint:** `GET /:id/recipe`
- **Description:** Returns only the recipe array for a specific menu item, with populated inventory details.

### 2.5 Update Menu Item Recipe
- **Endpoint:** `PATCH /:id/recipe`
- **Description:** Specific endpoint to update only the recipe of a menu item.
- **Request Body:**
  ```json
  {
    "recipe": [
      { "inventoryItem": "ID", "qty": 2 }
    ]
  }
  ```

### 2.6 Delete Menu Item
- **Endpoint:** `DELETE /:id`

---

## 3. Availability Logic (The "Stock Link")

The `isAvailable` flag is the core of the POS integration:
- **Calculation**: For a menu item to be `isAvailable: true`, it must have `isActive: true` AND every item in its `recipe` must have `inventoryItem.stock >= recipe.qty`.
- **Real-time**: This is NOT cached. Every `GET` request performs this check to ensure POS accuracy.
- **Frontend Recommendation**: Items with `isAvailable: false` should be visually disabled or labeled "Out of Stock" in the ordering interface.

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
