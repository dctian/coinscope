import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import {
  saveSearch,
  getAllSearches,
  getSearch,
  deleteSearch,
  clearHistory,
} from "../lib/historyStorage";
import type { SearchHistoryEntry } from "../types/history";

function makeEntry(
  overrides: Partial<SearchHistoryEntry> = {},
): SearchHistoryEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    imageBlob: new Blob(["fake-image"], { type: "image/jpeg" }),
    coins: [
      {
        id: "c1",
        name: "Test Coin",
        country: "US",
        year: 2020,
        denomination: "Quarter",
        face_value: 0.25,
        currency: "USD",
        obverse_description: null,
        reverse_description: null,
        confidence: 0.9,
      },
    ],
    totalCoinsDetected: 1,
    modelUsed: "test/model",
    ...overrides,
  };
}

// Reset IndexedDB between tests by deleting the database
beforeEach(async () => {
  await clearHistory();
});

describe("historyStorage", () => {
  it("saves and retrieves a search entry", async () => {
    const entry = makeEntry();
    await saveSearch(entry);

    const result = await getSearch(entry.id);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(entry.id);
    expect(result!.coins).toHaveLength(1);
    expect(result!.coins[0]!.name).toBe("Test Coin");
  });

  it("getAllSearches returns entries sorted by timestamp descending", async () => {
    const older = makeEntry({ id: "old", timestamp: 1000 });
    const newer = makeEntry({ id: "new", timestamp: 2000 });

    await saveSearch(older);
    await saveSearch(newer);

    const all = await getAllSearches();
    expect(all).toHaveLength(2);
    expect(all[0]!.id).toBe("new");
    expect(all[1]!.id).toBe("old");
  });

  it("getSearch returns null for non-existent id", async () => {
    const result = await getSearch("does-not-exist");
    expect(result).toBeNull();
  });

  it("deleteSearch removes a specific entry", async () => {
    const entry1 = makeEntry({ id: "keep" });
    const entry2 = makeEntry({ id: "remove" });

    await saveSearch(entry1);
    await saveSearch(entry2);

    await deleteSearch("remove");

    const all = await getAllSearches();
    expect(all).toHaveLength(1);
    expect(all[0]!.id).toBe("keep");
  });

  it("clearHistory removes all entries", async () => {
    await saveSearch(makeEntry({ id: "a" }));
    await saveSearch(makeEntry({ id: "b" }));

    await clearHistory();

    const all = await getAllSearches();
    expect(all).toHaveLength(0);
  });
});
