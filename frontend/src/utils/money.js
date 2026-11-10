export function formatMoney(amount, currency = "USD") {
  const value = Number(amount);
  const safe = Number.isFinite(value) ? value : 0;
  const code = currency || "USD";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(safe);
  } catch {
    return `${safe.toFixed(2)} ${code}`;
  }
}
