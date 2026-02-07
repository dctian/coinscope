import type { Coin } from "./coin";

/** A single saved search entry stored in IndexedDB. */
export interface SearchHistoryEntry {
  id: string;
  timestamp: number;
  imageBlob: Blob;
  coins: Coin[];
  totalCoinsDetected: number;
  modelUsed: string;
}
