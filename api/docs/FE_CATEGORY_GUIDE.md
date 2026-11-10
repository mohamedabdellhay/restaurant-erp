# Menu Categories API Guide (Frontend)

This guide explains how to interact with the **Menu Categories** API. Categories are used to group menu items (e.g., Appetizers, Main Courses, Drinks) and are scoped uniquely to each restaurant.

---

## Authentication & Scoping

- **Bearer Token Required**: All category endpoints require a valid JWT in the `Authorization` header.
- **Auto-Scoping**: The API automatically filters categories based on the restaurant associated with your token. You do **not** need to provide a `restaurantId` in your requests.

---

## Data Model: Category

| Field | Type | Description | Mandatory (POST) |
| :--- | :--- | :--- | :--- |
| `name` | String | Unique name of the category within the restaurant. | Yes |
| `description` | String | Short description of the category. | No |
| `image` | String | Full URL to the category image. | No |
| `isActive` | Boolean | Whether the category is active (default: true). | No |
| `restaurant` | ID | ObjectId of the restaurant (Output Only). | - |

---

## Endpoints

### 1. List All Categories
Retrieve all categories for your restaurant.
- **Method**: `GET`
- **URL**: `/api/categories`
- **Response**: Array of Category objects.

### 2. Get Category by ID
Retrieve details for a specific category.
- **Method**: `GET`
- **URL**: `/api/categories/:id`
- **Response**: Single Category object.

### 3. Create Category
Add a new category. **[Admin or Manager Only]**
- **Method**: `POST`
- **URL**: `/api/categories`
- **Body**:
  ```json
  {
    "name": "Appetizers",
    "description": "Start your meal right",
    "image": "https://example.com/images/app.jpg",
    "isActive": true
  }
  ```

### 4. Update Category
Modify an existing category. **[Admin or Manager Only]**
- **Method**: `PUT`
- **URL**: `/api/categories/:id`
- **Body**: Same as Create (can be partial).

### 5. Delete Category
Permanently remove a category. **[Admin Only]**
- **Method**: `DELETE`
- **URL**: `/api/categories/:id`

---

## Image Handling
The `image` field returns a full absolute URL (e.g., `http://api.restaurant.com/uploads/categories/image.png`). The backend automatically appends the `BASE_URL`, so you can use this field directly in `<img>` tags.

## Common Errors
- `401 Unauthorized`: Missing or invalid token.
- `403 Forbidden`: Insufficient permissions (e.g., Cashier trying to create a category).
- `404 Not Found`: Category does not exist or belongs to another restaurant.
- `400 Bad Request`: Validation error (e.g., duplicate category name).
