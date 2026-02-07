import { useState, useEffect, useCallback } from "react";
import type { Coin } from "../types/coin";
import type { SearchHistoryEntry } from "../types/history";
import * as historyStorage from "../lib/historyStorage";

export function useHistory() {
  const [entries, setEntries] = useState<SearchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const all = await historyStorage.getAllSearches();
      setEntries(all);
    } catch {
      // IndexedDB unavailable — silently degrade
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveSearch = useCallback(
    async (
      file: File,
      coins: Coin[],
      totalCoinsDetected: number,
      modelUsed: string,
    ): Promise<string> => {
      const id = crypto.randomUUID();
      const entry: SearchHistoryEntry = {
        id,
        timestamp: Date.now(),
        imageBlob: file,
        coins,
        totalCoinsDetected,
        modelUsed,
      };
      await historyStorage.saveSearch(entry);
      await refresh();
      return id;
    },
    [refresh],
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      await historyStorage.deleteSearch(id);
      await refresh();
    },
    [refresh],
  );

  const clearAll = useCallback(async () => {
    await historyStorage.clearHistory();
    await refresh();
  }, [refresh]);

  return { entries, loading, saveSearch, deleteEntry, clearAll };
}
