const FK_TO_FIELD = {
  restaurantId: "restaurant",
  roleId: "role",
  departmentId: "department",
  categoryId: "category",
  supplierId: "supplier",
  ingredientCategoryId: "ingredientCategory",
  tableId: "table",
  customerId: "customer",
  createdById: "createdBy",
  menuItemId: "menuItem",
  orderId: "order",
  productId: "product",
  issuedById: "issuedBy",
  planId: "plan",
  inventoryItemId: "inventoryItem",
};

/**
 * Turn a Prisma record into the document shape the API already returns.
 * Adds `_id` and exposes foreign keys under the old relation field names
 * when the relation itself was not loaded.
 */
export function toDoc(value, { keepPassword = false } = {}) {
  if (value == null) return value;
  if (value instanceof Date) return value;
  if (typeof value === "bigint") return Number(value);
  if (Array.isArray(value)) return value.map((item) => toDoc(item, { keepPassword }));
  if (typeof value !== "object") return value;

  const out = {};
  for (const [key, val] of Object.entries(value)) {
    if (key === "passwordHash" && !keepPassword) continue;
    out[key] = toDoc(val, { keepPassword });
  }

  if (typeof out.id === "string" && out._id == null) {
    out._id = out.id;
  }

  for (const [fk, field] of Object.entries(FK_TO_FIELD)) {
    if (out[fk] == null) continue;
    if (out[field] == null || typeof out[field] !== "object") {
      out[field] = out[fk];
    }
  }

  return out;
}

export function toDocs(rows) {
  return rows.map((row) => toDoc(row));
}
