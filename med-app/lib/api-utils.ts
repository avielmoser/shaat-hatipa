export function handleApiError(error: any) {
  console.error("API Error:", error);

  const message =
    error?.response?.data?.error ||
    error?.message ||
    "Unexpected error occurred";

  return {
    status: error?.response?.status || 500,
    body: {
      success: false,
      error: message,
    },
  };
}
