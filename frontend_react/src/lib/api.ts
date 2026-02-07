import type { CoinIdentificationResponse } from "../types/coin";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/** Custom error class for API failures. */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Upload an image to the coin identification endpoint.
 *
 * @param file - The image File to upload
 * @returns The identification response with detected coins
 * @throws ApiError if the request fails
 */
export async function identifyCoins(
  file: File,
): Promise<CoinIdentificationResponse> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE_URL}/api/v1/coins/identify`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = "Failed to identify coins";
    try {
      const errorBody: unknown = await response.json();
      if (
        typeof errorBody === "object" &&
        errorBody !== null &&
        "detail" in errorBody
      ) {
        errorMessage = String((errorBody as { detail: unknown }).detail);
      }
    } catch {
      errorMessage = `Server error: ${response.status}`;
    }
    throw new ApiError(errorMessage, response.status);
  }

  const data: CoinIdentificationResponse = await response.json();
  return data;
}

/**
 * Check if the backend API is healthy.
 *
 * @returns true if the API is reachable and healthy
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/coins/health`);
    return response.ok;
  } catch {
    return false;
  }
}
