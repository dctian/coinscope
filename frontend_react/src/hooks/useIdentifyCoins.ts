import { useMutation } from "@tanstack/react-query";
import { identifyCoins } from "../lib/api";
import type { CoinIdentificationResponse } from "../types/coin";
import type { ApiError } from "../lib/api";

/**
 * TanStack Query mutation hook for the coin identification endpoint.
 *
 * Usage:
 * ```ts
 * const { mutate, isPending, isError, error, data } = useIdentifyCoins();
 * mutate(file); // triggers the upload
 * ```
 */
export function useIdentifyCoins() {
  return useMutation<CoinIdentificationResponse, ApiError, File>({
    mutationFn: identifyCoins,
  });
}
