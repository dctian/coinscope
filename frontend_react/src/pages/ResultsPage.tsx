import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import CoinCard from "../components/CoinCard";
import CoinDetailModal from "../components/CoinDetailModal";
import type { Coin, ResultsLocationState } from "../types/coin";

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);

  const state = location.state as ResultsLocationState | null;

  // If there's no state (e.g. user navigated directly), redirect home
  useEffect(() => {
    if (!state) {
      navigate("/", { replace: true });
    }
  }, [state, navigate]);

  // Revoke the object URL when the component unmounts to avoid memory leaks
  useEffect(() => {
    return () => {
      if (state?.imageUrl) {
        URL.revokeObjectURL(state.imageUrl);
      }
    };
    // We intentionally only run cleanup on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!state) {
    return null;
  }

  const { coins, modelUsed, imageUrl } = state;
  const modelShortName = modelUsed.split("/").pop() ?? modelUsed;

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
          <h1 className="text-lg font-semibold text-gray-900">Results</h1>
        </header>

        {coins.length === 0 ? (
          /* ---------- Empty state ---------- */
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
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
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <h2 className="mt-6 text-xl font-semibold text-gray-900">
              No Coins Detected
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              We couldn&apos;t identify any coins in this image. Try taking a
              clearer photo with good lighting.
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="btn-primary mt-8"
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
                  d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                />
              </svg>
              Try Again
            </button>
          </div>
        ) : (
          /* ---------- Results list ---------- */
          <div className="flex-1 px-4 pb-24">
            {/* Image preview */}
            <div className="mt-2 overflow-hidden rounded-2xl shadow-md">
              <img
                src={imageUrl}
                alt="Uploaded coin"
                className="h-48 w-full object-cover"
              />
            </div>

            {/* Summary row */}
            <div className="mt-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">
                {coins.length} Coin{coins.length !== 1 ? "s" : ""} Found
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                  />
                </svg>
                {modelShortName}
              </span>
            </div>

            {/* Coin cards */}
            <div className="mt-4 flex flex-col gap-3">
              {coins.map((coin) => (
                <CoinCard
                  key={coin.id}
                  coin={coin}
                  onTap={() => setSelectedCoin(coin)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedCoin && (
        <CoinDetailModal
          coin={selectedCoin}
          onClose={() => setSelectedCoin(null)}
        />
      )}
    </Layout>
  );
}
