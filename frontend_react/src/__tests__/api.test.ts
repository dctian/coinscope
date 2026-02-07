import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { identifyCoins, checkHealth } from "../lib/api";

// ---------------------------------------------------------------------------
// Mock global.fetch
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// identifyCoins
// ---------------------------------------------------------------------------

describe("identifyCoins", () => {
  it("returns parsed response on success", async () => {
    const payload = {
      coins: [
        {
          id: "1",
          name: "Penny",
          country: "US",
          year: 2020,
          denomination: "1 cent",
          face_value: 0.01,
          currency: "USD",
          obverse_description: null,
          reverse_description: null,
          confidence: 0.9,
        },
      ],
      total_coins_detected: 1,
      model_used: "test-model",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => payload,
    });

    const file = new File(["fake"], "coin.jpg", { type: "image/jpeg" });
    const result = await identifyCoins(file);

    expect(result.total_coins_detected).toBe(1);
    expect(result.coins[0]?.name).toBe("Penny");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Verify the request was a POST with FormData
    const [url, options] = mockFetch.mock.calls[0]!;
    expect(url).toContain("/api/v1/coins/identify");
    expect(url).not.toContain("model=");
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
  });

  it("appends model query param when model is provided", async () => {
    const payload = {
      coins: [],
      total_coins_detected: 0,
      model_used: "gemini-2.0-flash-lite",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => payload,
    });

    const file = new File(["fake"], "coin.jpg", { type: "image/jpeg" });
    await identifyCoins(file, "gemini-2.0-flash-lite");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0]!;
    const url = callArgs[0] as string;
    expect(url).toContain("model=gemini-2.0-flash-lite");
  });

  it("does not append model query param when model is undefined", async () => {
    const payload = {
      coins: [],
      total_coins_detected: 0,
      model_used: "default-model",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => payload,
    });

    const file = new File(["fake"], "coin.jpg", { type: "image/jpeg" });
    await identifyCoins(file, undefined);

    const [url] = mockFetch.mock.calls[0]!;
    expect(url).not.toContain("model=");
  });

  it("throws ApiError with detail message on API error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ detail: "Invalid file type" }),
    });

    const file = new File(["fake"], "test.txt", { type: "text/plain" });
    await expect(identifyCoins(file)).rejects.toThrow("Invalid file type");

    try {
      await identifyCoins(file);
    } catch (e) {
      // The first call already consumed the mock; add another for the second call
    }
  });

  it("throws ApiError with status on non-JSON error response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("not JSON");
      },
    });

    const file = new File(["fake"], "coin.jpg", { type: "image/jpeg" });
    await expect(identifyCoins(file)).rejects.toThrow("Server error: 500");
  });

  it("propagates network errors", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const file = new File(["fake"], "coin.jpg", { type: "image/jpeg" });
    await expect(identifyCoins(file)).rejects.toThrow("Failed to fetch");
  });
});

// ---------------------------------------------------------------------------
// checkHealth
// ---------------------------------------------------------------------------

describe("checkHealth", () => {
  it("returns true when API is healthy", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const result = await checkHealth();
    expect(result).toBe(true);
  });

  it("returns false when API returns error", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    const result = await checkHealth();
    expect(result).toBe(false);
  });

  it("returns false on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network down"));
    const result = await checkHealth();
    expect(result).toBe(false);
  });
});
