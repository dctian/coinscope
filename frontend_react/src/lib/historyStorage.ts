import type { SearchHistoryEntry } from "../types/history";

const DB_NAME = "coinscope-history";
const STORE_NAME = "searches";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        const request = callback(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
      }),
  );
}

export async function saveSearch(entry: SearchHistoryEntry): Promise<void> {
  await withStore("readwrite", (store) => store.put(entry));
}

export async function getAllSearches(): Promise<SearchHistoryEntry[]> {
  const entries = await withStore<SearchHistoryEntry[]>(
    "readonly",
    (store) => store.getAll(),
  );
  return entries.sort((a, b) => b.timestamp - a.timestamp);
}

export async function getSearch(
  id: string,
): Promise<SearchHistoryEntry | null> {
  const result = await withStore<SearchHistoryEntry | undefined>(
    "readonly",
    (store) => store.get(id),
  );
  return result ?? null;
}

export async function deleteSearch(id: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(id));
}

export async function clearHistory(): Promise<void> {
  await withStore("readwrite", (store) => store.clear());
}
