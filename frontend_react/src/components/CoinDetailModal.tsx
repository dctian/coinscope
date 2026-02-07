import { useEffect, useCallback } from "react";
import type { Coin } from "../types/coin";
import ConfidenceBadge from "./ConfidenceBadge";

interface CoinDetailModalProps {
  coin: Coin;
  onClose: () => void;
}

/** Bottom-sheet style modal showing full coin details. */
export default function CoinDetailModal({
  coin,
  onClose,
}: CoinDetailModalProps) {
  const yearDisplay = coin.year != null ? String(coin.year) : "Unknown";
  const faceValueDisplay =
    coin.face_value != null ? coin.face_value.toFixed(2) : "N/A";

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll while modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div className="relative z-10 w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl sm:max-h-[85vh]">
        {/* Drag handle */}
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-gray-300 sm:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{coin.name}</h2>
            <p className="mt-1 text-base text-gray-500">{coin.country}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
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
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <hr className="my-5 border-gray-200" />

        {/* Detail rows */}
        <div className="space-y-3">
          <DetailRow label="Year" value={yearDisplay} />
          <DetailRow label="Denomination" value={coin.denomination} />
          <DetailRow label="Currency" value={coin.currency} />
          <DetailRow label="Face Value" value={faceValueDisplay} />
          <div className="flex items-center justify-between py-1">
            <span className="text-gray-500">Confidence</span>
            <ConfidenceBadge confidence={coin.confidence} />
          </div>
        </div>

        {/* Obverse description */}
        {coin.obverse_description && (
          <div className="mt-5">
            <h4 className="text-sm font-semibold text-gray-700">
              Front (Obverse)
            </h4>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              {coin.obverse_description}
            </p>
          </div>
        )}

        {/* Reverse description */}
        {coin.reverse_description && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-700">
              Back (Reverse)
            </h4>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              {coin.reverse_description}
            </p>
          </div>
        )}

        {/* Coming-soon info box */}
        <div className="mt-6 flex items-start gap-3 rounded-xl bg-gray-100 p-4">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
            />
          </svg>
          <p className="text-sm text-gray-600">
            Pricing and seller links coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
