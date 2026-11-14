export function uploadUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  const origin = String(import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/api\/?$/, "");
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
