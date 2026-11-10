export function getErrorMessage(error, fallback = "Something went wrong") {
  const data = error?.response?.data;
  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }
  if (error?.code === "ERR_NETWORK" || error?.message === "Network Error") {
    return "Cannot reach the server. Check your connection.";
  }
  if (
    typeof error?.message === "string" &&
    error.message.trim() &&
    !error.message.startsWith("Request failed with status code")
  ) {
    return error.message;
  }
  return fallback;
}
