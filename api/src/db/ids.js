const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return typeof value === "string" && UUID_RE.test(value);
}

/** Read an id from a string or a populated record. */
export function refId(value) {
  if (value == null || value === "") return null;
  if (typeof value === "string") return value;
  return value._id || value.id || null;
}

export function requireUuid(value) {
  const id = refId(value);
  return isUuid(id) ? id : null;
}
