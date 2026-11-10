# دليل فرونت إند - إدارة المخزون والموردين (Inventory & Suppliers)

يوفر نظام "Restaurant ERP" وحدة متكاملة لإدارة المخزون، تتبع حركة الأصناف، وإدارة الموردين مع دعم العزل الكامل بين المطاعم.

---

> [!IMPORTANT]
> **Multi-Tenancy Alert**: All inventory data is now isolated per restaurant. Check the [Frontend Integration Guide](./FRONTEND_API_README.md) for details on authenticating and handling scoped data.

## ملاحظات هامة

- **الرابط الأساسي**:
  - الموردين: `{{BASE_URL}}/api/inventory/suppliers`
  - الأصناف: `{{BASE_URL}}/api/inventory/items`
- **المصادقة**: تتطلب جميع العمليات `AccessToken` في الـ Header كـ `Bearer Token`.
- **التحديث التلقائي للمخزون**: عند تحديث المخزون (Stock Update)، يقوم النظام تلقائياً بتسجيل "حركة مخزنية" (Stock Movement) لأغراض المراجعة.

---

## إدارة الموردين (Suppliers)

> [!NOTE]
> للحصول على تفاصيل تقنية كاملة حول جميع الـ Endpoints والـ Data Model، يرجى مراجعة [دليل الموردين التفصيلي (Suppliers API Documentation)](./SUPPLIERS_API_DOCUMENTATION.md).

### 1. عرض جميع الموردين

- **الرابط**: `GET /suppliers`
- **الوصف**: يعرض قائمة بجميع الموردين المسجلين للمطعم الحالي.

### 2. إضافة مورد جديد

- **الرابط**: `POST /suppliers`
- **Body**:

```json
{
  "name": "شركة التوريدات العالمية",
  "phone": "0123456789",
  "email": "supplier@example.com",
  "paymentTerms": "cash" // [cash, credit, installment]
}
```

---

## إدارة الأصناف (Inventory Items)

### 1. عرض جميع الأصناف

- **الرابط**: `GET /items`
- **الوصف**: يعرض الأصناف مع بيانات المورد.

### 2. تنبيهات نقص المخزون

- **الرابط**: `GET /items/low-stock`
- **الوصف**: يعرض الأصناف التي وصل رصيدها إلى حد الأمان (minStockAlert) أو أقل.

### 3. إضافة صنف جديد

- **الرابط**: `POST /items`
- **Body**:

```json
{
  "name": "أرز بسمتي",
  "sku": "RIC-001",
  "unit": "kg",
  "costPrice": 50,
  "supplier": "ID_OF_SUPPLIER",
  "minStockAlert": 10
}
```

### 4. تحديث رصيد المخزون (زيادة/نقص) 🔄

- **الرابط**: `PATCH /items/:id/stock`
- **Body**:

```json
{
  "amount": 20,
  "type": "addition" // [addition, deduction]
}
```

---

# Frontend Guide - Inventory & Suppliers (English)

The "Restaurant ERP" system provides a complete module for inventory tracking, stock movements, and supplier management.

---

## Important Notes

- **Base URL**:
  - Suppliers: `{{BASE_URL}}/api/inventory/suppliers`
  - Items: `{{BASE_URL}}/api/inventory/items`
- **Authorization**: All endpoints require a `Bearer Token`.
- **Audit Logging**: Any stock update automatically creates a `StockMovement` record for audit purposes.

---

## Supplier Management

> [!NOTE]
> For full technical details on all endpoints and the data model, please refer to the [Detailed Suppliers API Documentation](./SUPPLIERS_API_DOCUMENTATION.md).

### 1. List All Suppliers

- **URL**: `GET /suppliers`
- **Description**: Returns all suppliers for the current restaurant.

### 2. Add New Supplier

- **URL**: `POST /suppliers`
- **Body**:

```json
{
  "name": "Global Supplies Co.",
  "phone": "0123456789",
  "paymentTerms": "credit"
}
```

### 3. Supplier Account Statement

- **URL**: `GET /suppliers/:id/statement`
- **Description**: Returns all purchase/payment transactions and the current balance.

### 4. Record Supplier Payment

- **URL**: `POST /suppliers/:id/payments`
- **Body**:

```json
{
  "amount": 500,
  "description": "Partial payment"
}
```

---

## Inventory Items

### 1. List Items

- **URL**: `GET /items`
- **Description**: Returns all items with populated supplier names.

### 2. Low Stock Alerts

- **URL**: `GET /items/low-stock`
- **Description**: Returns items where `stock <= minStockAlert`.

### 3. Update Stock Level

- **URL**: `PATCH /items/:id/stock`
- **Body**:

```json
{
  "amount": 5,
  "type": "deduction"
}
```
