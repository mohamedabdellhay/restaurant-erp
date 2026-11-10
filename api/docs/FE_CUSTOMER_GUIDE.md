# دليل فرونت إند - إدارة العملاء (Customer Management)

يوفر نظام "Restaurant ERP" واجهة برمجية (API) لإدارة العملاء بشكل متكامل، مع دعم العزل الكامل بين المطاعم (Multi-tenant isolation).

---

## ملاحظات هامة

- **التواصل مع الـ API**: جميع الروابط تبدأ بـ `{{BASE_URL}}/api/customers`.
- **المصادقة (Authorization)**: جميع العمليات (ماعدا طلب الحجز العام) تتطلب إرسال `AccessToken` في الـ Header كـ `Bearer Token`.
- **عزل البيانات (Scoping)**: لا تقلق بشأن إرسال معرف المطعم في كل طلب؛ النظام يتعرف تلقائياً على المطعم الخاص بك من خلال الـ Token ويقوم بفلترة النتائج لك.
- **تكرار البيانات**: يمكن لنفس رقم الهاتف أن يتواجد في النظام ولكن لمطاعم مختلفة فقط.

---

## العمليات المتاحة (Endpoints)

### 1. عرض جميع العملاء

- **الرابط**: `GET /`
- **الصلاحيات**: Admin, Manager
- **الوصف**: يعرض جميع العملاء المسجلين في مطعمك الحالي فقط.

### 2. البحث عن عميل

- **الرابط**: `GET /search?q={query}`
- **الوصف**: البحث بالاسم أو رقم الهاتف (بحث جزئي).
- **مثال**: `/api/customers/search?q=010`

### 3. إضافة عميل جديد

- **الرابط**: `POST /`
- **Body**:

```json
{
  "name": "اسم العميل",
  "phone": "0123456789",
  "email": "email@example.com", (اختياري)
  "address": "عنوان العميل" (اختياري)
}
```

### 4. تحديث بيانات عميل

- **الرابط**: `PUT /:id`
- **الوصف**: تحديث بيانات عميل موجود بالفعل.

### 5. حذف عميل

- **الرابط**: `DELETE /:id`
- **الصلاحيات**: Admin فقط.

---

## أمثلة الاستخدام (Usage Examples)

### البحث والإضافة (Workflow)

في صفحة الـ POS أو الحجز، يُفضل اتباع هذا التسلسل:

1. ابحث عن العميل برقم الهاتف عبر `GET /search?q={phone}`.
2. إذا وجدت نتائج، اختر العميل.
3. إذا لم تجد نتائج، قم بفتح نافذة "إضافة عميل جديد" واستخدم `POST /`.

---

# Frontend Guide - Customer Management (English)

The "Restaurant ERP" system provides a robust API for customer management with full multi-tenant isolation.

---

## Important Notes

- **API Base**: All endpoints start with `{{BASE_URL}}/api/customers`.
- **Authorization**: All internal operations require an `AccessToken` in the header as a `Bearer Token`.
- **Data Scoping**: You don't need to specify the restaurant ID manually. The system identifies your restaurant from your token and filters the data automatically.
- **Data Uniqueness**: A phone number can exist multiple times in the system as long as it's for different restaurants.

---

## Available Endpoints

### 1. List All Customers

- **URL**: `GET /`
- **Access**: Admin, Manager
- **Description**: Returns all customers registered under your current restaurant.

### 2. Search Customers

- **URL**: `GET /search?q={query}`
- **Description**: Partial search by name or phone.
- **Example**: `/api/customers/search?q=John`

### 3. Add New Customer

- **URL**: `POST /`
- **Body**:

```json
{
  "name": "Customer Name",
  "phone": "0123456789",
  "email": "email@example.com", (Optional)
  "address": "Address Details" (Optional)
}
```

### 4. Update Customer

- **URL**: `PUT /:id`

### 5. Delete Customer

- **URL**: `DELETE /:id`
- **Access**: Admin only.
