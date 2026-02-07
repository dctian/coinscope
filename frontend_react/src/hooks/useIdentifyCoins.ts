import { useMutation } from "@tanstack/react-query";
import { identifyCoins } from "../lib/api";
import type { CoinIdentificationResponse } from "../types/coin";
import type { ApiError } from "../lib/api";

/** Variables passed to the identify-coins mutation. */
export interface IdentifyCoinsMutationVars {
  file: File;
  model?: string;
}

/**
 * TanStack Query mutation hook for the coin identification endpoint.
 *
 * Usage:
 * ```ts
 * const { mutate, isPending, isError, error, data } = useIdentifyCoins();
 * mutate({ file, model: "gemini-3-pro-preview" }); // triggers the upload
 * ```
 */
export function useIdentifyCoins() {
  return useMutation<
    CoinIdentificationResponse,
    ApiError,
    IdentifyCoinsMutationVars
  >({
    mutationFn: ({ file, model }) => identifyCoins(file, model),
  });
}
