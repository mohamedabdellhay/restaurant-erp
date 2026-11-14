function readList(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readExpenseCategories(restaurantId) {
  return readList(`expenseCategories:${restaurantId || "restaurant"}`);
}

export function readExpenses(restaurantId) {
  return readList(`expenses:${restaurantId || "restaurant"}`);
}

export function writeExpenses(restaurantId, rows) {
  localStorage.setItem(`expenses:${restaurantId || "restaurant"}`, JSON.stringify(rows));
}
