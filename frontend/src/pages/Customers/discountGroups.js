function catalogKey(restaurantId) {
  return `discountGroupCatalog:${restaurantId || "restaurant"}`;
}

export function assignmentKey(restaurantId) {
  return `customerDiscountGroups:${restaurantId || "restaurant"}`;
}

function readObject(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "");
    if (Array.isArray(fallback) && Array.isArray(parsed)) return parsed;
    if (!Array.isArray(fallback) && parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    return fallback;
  } catch {
    return fallback;
  }
}

export function readDiscountGroups(restaurantId) {
  return readObject(catalogKey(restaurantId), []);
}

export function writeDiscountGroups(restaurantId, rows) {
  localStorage.setItem(catalogKey(restaurantId), JSON.stringify(rows));
}

export function readDiscountAssignments(restaurantId) {
  return readObject(assignmentKey(restaurantId), {});
}

export function discountGroupName(groups, stored) {
  if (!stored) return "";
  return groups.find((group) => group.id === stored)?.name || stored;
}
