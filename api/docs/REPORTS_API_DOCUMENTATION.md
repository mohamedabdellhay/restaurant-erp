# Restaurant ERP - Reports API Documentation

## Base URL
`/api/reports`

## Authentication
All endpoints require:
- `Authorization: Bearer <token>` header
- The authenticated user must have the `view_reports` permission

## Date Format
All date query parameters use `YYYY-MM-DD` (e.g. `2025-01-31`). Both `from` and `to` are inclusive bounds.

---

## Endpoints

### 1. Sales Performance Report

**`GET /reports/sales`**

Returns overall sales metrics for paid orders, a daily revenue trend, and revenue split by payment method.

**Query Parameters**

| Parameter | Type   | Required | Description                       |
|-----------|--------|----------|-----------------------------------|
| `from`    | string | No       | Start date (YYYY-MM-DD, inclusive) |
| `to`      | string | No       | End date (YYYY-MM-DD, inclusive)   |

**Example Response**
```json
{
  "success": true,
  "message": "Sales report retrieved successfully",
  "data": {
    "totalRevenue": 48500.00,
    "averageOrderValue": 145.30,
    "totalTax": 2750.00,
    "totalServiceCharge": 970.00,
    "count": 334,
    "dailyTrend": [
      { "date": "2025-01-01", "revenue": 1200.00, "orders": 8 },
      { "date": "2025-01-02", "revenue": 1850.50, "orders": 13 }
    ],
    "byPaymentMethod": [
      { "paymentMethod": "cash",   "revenue": 22000.00, "count": 152 },
      { "paymentMethod": "card",   "revenue": 18000.00, "count": 130 },
      { "paymentMethod": "wallet", "revenue":  8500.00, "count":  52 }
    ]
  }
}
```

---

### 2. Inventory Summary Report

**`GET /reports/inventory`**

Returns the total inventory count, total stock value, number of low-stock items, and a detailed list of items whose current stock is at or below their `minStockAlert` threshold.

**Query Parameters** — None

**Example Response**
```json
{
  "success": true,
  "message": "Inventory report retrieved successfully",
  "data": {
    "totalItems": 84,
    "totalStockValue": 32400.00,
    "lowStockCount": 5,
    "lowStockItems": [
      {
        "_id": "664abc...",
        "name": "Olive Oil",
        "sku": "OO-001",
        "unit": "litre",
        "stock": 2,
        "minStockAlert": 5,
        "costPrice": 35.00,
        "supplier": {
          "_id": "663def...",
          "name": "Fresh Foods Co.",
          "phone": "+201000000001"
        }
      }
    ]
  }
}
```

---

### 3. Order Analytics Report

**`GET /reports/orders`**

Returns multi-faceted order analytics: status distribution, order type breakdown, hourly traffic trends, daily revenue trends, and the top 5 most-ordered menu items.

**Query Parameters**

| Parameter | Type   | Required | Description                        |
|-----------|--------|----------|------------------------------------|
| `from`    | string | No       | Start date (YYYY-MM-DD, inclusive)  |
| `to`      | string | No       | End date (YYYY-MM-DD, inclusive)    |

**Example Response**
```json
{
  "success": true,
  "message": "Order analytics retrieved successfully",
  "data": {
    "statusDistribution": [
      { "status": "paid",      "count": 334 },
      { "status": "cancelled", "count":  12 },
      { "status": "pending",   "count":   5 }
    ],
    "typeDistribution": [
      { "type": "dineIn",   "count": 200 },
      { "type": "takeaway", "count":  90 },
      { "type": "delivery", "count":  61 }
    ],
    "hourlyTrends": [
      { "hour": 12, "count": 45 },
      { "hour": 13, "count": 67 },
      { "hour": 20, "count": 82 }
    ],
    "dailyTrends": [
      { "date": "2025-01-01", "count": 21, "revenue": 3050.00 }
    ],
    "topItems": [
      { "menuItemId": "665aaa...", "name": "Grilled Chicken", "totalQty": 210, "revenue": 10500.00 },
      { "menuItemId": "665bbb...", "name": "Beef Burger",     "totalQty": 185, "revenue":  9250.00 }
    ]
  }
}
```

---

### 4. Reservations Report

**`GET /reports/reservations`**

Returns reservation statistics: counts by status, total guests, how many upcoming reservations exist, and the busiest days of the week (1 = Sunday, 7 = Saturday per MongoDB `$dayOfWeek`).

**Query Parameters**

| Parameter | Type   | Required | Description                        |
|-----------|--------|----------|------------------------------------|
| `from`    | string | No       | Start date filter on `reservedAt`  |
| `to`      | string | No       | End date filter on `reservedAt`    |

**Example Response**
```json
{
  "success": true,
  "message": "Reservations report retrieved successfully",
  "data": {
    "totalReservations": 120,
    "totalGuests": 480,
    "upcomingCount": 14,
    "statusDistribution": [
      { "status": "confirmed",  "count": 75, "totalGuests": 300 },
      { "status": "pending",    "count": 25, "totalGuests": 100 },
      { "status": "cancelled",  "count": 15, "totalGuests":  60 },
      { "status": "completed",  "count":  5, "totalGuests":  20 }
    ],
    "busiestDays": [
      { "dayOfWeek": 6, "count": 30 },
      { "dayOfWeek": 7, "count": 28 },
      { "dayOfWeek": 5, "count": 22 }
    ]
  }
}
```

> **Note:** `dayOfWeek` uses MongoDB's `$dayOfWeek` operator: `1` = Sunday, `2` = Monday, …, `7` = Saturday.

---

### 5. Staff Performance Report

**`GET /reports/staff-performance`**

Returns per-staff metrics for paid orders handled within the specified period. Results are ordered by `totalRevenue` descending.

**Query Parameters**

| Parameter | Type   | Required | Description                        |
|-----------|--------|----------|------------------------------------|
| `from`    | string | No       | Start date (YYYY-MM-DD, inclusive)  |
| `to`      | string | No       | End date (YYYY-MM-DD, inclusive)    |

**Example Response**
```json
{
  "success": true,
  "message": "Staff performance report retrieved successfully",
  "data": [
    {
      "staffId":      "661aaa...",
      "staffName":    "Ahmed Mohamed",
      "staffEmail":   "ahmed@restaurant.com",
      "ordersHandled": 92,
      "totalRevenue":  13800.00,
      "avgOrderValue":  150.00
    },
    {
      "staffId":      "661bbb...",
      "staffName":    "Sara Ali",
      "staffEmail":   "sara@restaurant.com",
      "ordersHandled": 78,
      "totalRevenue":  10920.00,
      "avgOrderValue":  140.00
    }
  ]
}
```

---

### 6. Revenue Breakdown

**`GET /reports/revenue`**

Returns revenue grouped by a time period (`day`, `week`, or `month`), with overall totals and a payment-method split. Scoped to paid orders.

**Query Parameters**

| Parameter | Type   | Required | Default | Description                                       |
|-----------|--------|----------|---------|---------------------------------------------------|
| `from`    | string | No       | —       | Start date (YYYY-MM-DD, inclusive)                |
| `to`      | string | No       | —       | End date (YYYY-MM-DD, inclusive)                  |
| `groupBy` | string | No       | `day`   | Time grouping: `day`, `week`, or `month`          |

**Example Response** (`groupBy=month`)
```json
{
  "success": true,
  "message": "Revenue breakdown retrieved successfully",
  "data": {
    "groupBy": "month",
    "totalRevenue": 48500.00,
    "totalOrders": 334,
    "trend": [
      { "period": "2025-01", "revenue": 14200.00, "orders": 98 },
      { "period": "2025-02", "revenue": 18300.00, "orders": 126 },
      { "period": "2025-03", "revenue": 16000.00, "orders": 110 }
    ],
    "byPaymentMethod": [
      { "paymentMethod": "cash", "revenue": 22000.00, "count": 152 },
      { "paymentMethod": "card", "revenue": 26500.00, "count": 182 }
    ]
  }
}
```

> **Note:** Weekly periods use ISO week format (`YYYY-WW`), e.g. `"2025-05"` = ISO week 5 of 2025.

---

### 7. Top Selling Items

**`GET /reports/top-items`**

Returns the top menu items by quantity sold in paid orders, including revenue per item.

**Query Parameters**

| Parameter | Type    | Required | Default | Description                          |
|-----------|---------|----------|---------|--------------------------------------|
| `from`    | string  | No       | —       | Start date (YYYY-MM-DD, inclusive)   |
| `to`      | string  | No       | —       | End date (YYYY-MM-DD, inclusive)     |
| `limit`   | integer | No       | `10`    | Maximum number of items to return    |

**Example Response**
```json
{
  "success": true,
  "message": "Top selling items retrieved successfully",
  "data": [
    { "menuItemId": "665aaa...", "name": "Grilled Chicken", "totalQty": 210, "revenue": 10500.00 },
    { "menuItemId": "665bbb...", "name": "Beef Burger",     "totalQty": 185, "revenue":  9250.00 },
    { "menuItemId": "665ccc...", "name": "Caesar Salad",    "totalQty": 142, "revenue":  4970.00 }
  ]
}
```

---

## Standard Response Envelope

All successful responses use this structure:

```json
{
  "success": true,
  "message": "Human-readable success message",
  "data": { }
}
```

## Error Responses

| Status | Meaning                                               |
|--------|-------------------------------------------------------|
| `401`  | Missing or invalid Bearer token                       |
| `403`  | Authenticated user lacks `view_reports` permission    |
| `500`  | Internal server error (check server logs)             |

---

## Notes

- All monetary values (`revenue`, `total`, `avgOrderValue`, etc.) are in the restaurant's base currency without a currency symbol.
- Empty date ranges return data for all time.
- Staff with no paid orders in the given range are not included in the staff performance results.
- Low-stock items are those where `stock <= minStockAlert` at query time.
