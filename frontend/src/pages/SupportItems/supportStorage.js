function readList(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function categoryKey(restaurantId) {
  return `supportItemCategories:${restaurantId || "restaurant"}`;
}

export function itemKey(restaurantId) {
  return `supportItems:${restaurantId || "restaurant"}`;
}

export function readCategories(restaurantId) {
  return readList(categoryKey(restaurantId));
}

export function writeCategories(restaurantId, rows) {
  localStorage.setItem(categoryKey(restaurantId), JSON.stringify(rows));
}

export function readItems(restaurantId) {
  return readList(itemKey(restaurantId));
}

export function writeItems(restaurantId, rows) {
  localStorage.setItem(itemKey(restaurantId), JSON.stringify(rows));
}

export function stockLevel(quantity, capacity) {
  const qty = Number(quantity) || 0;
  const cap = Number(capacity) || 0;
  if (qty <= 0) return "out_of_stock";
  if (cap > 0 && qty > cap) return "over_stock";
  if (cap > 0 && qty <= cap * 0.4) return "under_stock";
  return "in_stock";
}
