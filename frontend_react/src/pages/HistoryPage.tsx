import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useHistory } from "../hooks/useHistory";
import type { SearchHistoryEntry } from "../types/history";
import type { ResultsLocationState } from "../types/coin";

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Individual history entry row with its own object URL lifecycle. */
function HistoryEntry({
  entry,
  onSelect,
}: {
  entry: SearchHistoryEntry;
  onSelect: (entry: SearchHistoryEntry) => void;
}) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(entry.imageBlob);
    setThumbUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [entry.imageBlob]);

  const firstCoinName = entry.coins[0]?.name ?? "No coins";
  const modelShort = entry.modelUsed.split("/").pop() ?? entry.modelUsed;

  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      className="flex w-full items-center gap-4 rounded-2xl border border-gray-200/80 bg-white/60 p-3 text-left backdrop-blur-sm transition-colors hover:bg-white"
    >
      {thumbUrl && (
        <img
          src={thumbUrl}
          alt="Search thumbnail"
          className="h-16 w-16 shrink-0 rounded-xl object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">
          {firstCoinName}
        </p>
        <p className="mt-0.5 text-xs text-gray-500">
          {entry.totalCoinsDetected} coin
          {entry.totalCoinsDetected !== 1 ? "s" : ""} found
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {formatDate(entry.timestamp)}
          </span>
          <span className="text-xs text-gray-300">|</span>
          <span className="text-xs text-gray-400">{modelShort}</span>
        </div>
      </div>
      <svg
        className="h-5 w-5 shrink-0 text-gray-300"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m8.25 4.5 7.5 7.5-7.5 7.5"
        />
      </svg>
    </button>
  );
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { entries, loading, clearAll } = useHistory();
  const [confirmClear, setConfirmClear] = useState(false);

  // Memoize entries list to avoid unnecessary re-renders
  const sortedEntries = useMemo(() => entries, [entries]);

  const handleSelect = (entry: SearchHistoryEntry) => {
    const imageUrl = URL.createObjectURL(entry.imageBlob);
    const state: ResultsLocationState = {
      coins: entry.coins,
      totalCoinsDetected: entry.totalCoinsDetected,
      modelUsed: entry.modelUsed,
      imageUrl,
    };
    navigate("/results", { state });
  };

  const handleClear = async () => {
    await clearAll();
    setConfirmClear(false);
  };

  return (
    <Layout>
      <div className="flex min-h-screen flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center gap-3 bg-white/80 px-4 py-3 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
            aria-label="Go back"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            Search History
          </h1>
        </header>

        {/* Content */}
        <div className="flex-1 px-4 pb-8">
          {loading ? (
            <div className="flex flex-1 flex-col items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
            </div>
          ) : sortedEntries.length === 0 ? (
            /* Empty state */
            <div className="flex flex-1 flex-col items-center justify-center px-8 py-20 text-center">
              <svg
                className="h-20 w-20 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              <h2 className="mt-6 text-xl font-semibold text-gray-900">
                No Search History
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Your past coin searches will appear here.
              </p>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="btn-primary mt-8"
              >
                Identify Coins
              </button>
            </div>
          ) : (
            <>
              {/* History entries list */}
              <div className="mt-2 flex flex-col gap-3">
                {sortedEntries.map((entry) => (
                  <HistoryEntry
                    key={entry.id}
                    entry={entry}
                    onSelect={handleSelect}
                  />
                ))}
              </div>

              {/* Clear history button */}
              <div className="mt-8 flex justify-center">
                {confirmClear ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      Clear all history?
                    </span>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                    data-testid="clear-history-button"
                  >
                    Clear History
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
