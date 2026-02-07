import type { Coin } from "../types/coin";
import ConfidenceBadge from "./ConfidenceBadge";

interface CoinCardProps {
  coin: Coin;
  onTap: () => void;
}

/** Card displaying a single identified coin's key information. */
export default function CoinCard({ coin, onTap }: CoinCardProps) {
  const yearDisplay = coin.year != null ? String(coin.year) : "Unknown year";

  return (
    <button
      type="button"
      onClick={onTap}
      className="w-full cursor-pointer rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Header: name + confidence */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-900">{coin.name}</h3>
        <ConfidenceBadge confidence={coin.confidence} />
      </div>

      {/* Chips: country, year, denomination */}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="chip">
          <FlagIcon />
          {coin.country}
        </span>
        <span className="chip">
          <CalendarIcon />
          {yearDisplay}
        </span>
        <span className="chip">
          <CoinIcon />
          {coin.denomination} ({coin.currency})
        </span>
      </div>

      {/* Descriptions */}
      {(coin.obverse_description || coin.reverse_description) && (
        <>
          <hr className="my-3 border-gray-100" />
          {coin.obverse_description && (
            <DescriptionRow label="Front" text={coin.obverse_description} />
          )}
          {coin.reverse_description && (
            <DescriptionRow label="Back" text={coin.reverse_description} />
          )}
        </>
      )}
    </button>
  );
}

/* ---------- Small helper components ---------- */

function DescriptionRow({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-1 flex gap-2 text-sm">
      <span className="w-10 shrink-0 font-medium text-gray-500">{label}:</span>
      <span className="text-gray-700">{text}</span>
    </div>
  );
}

/* ---------- Inline SVG icons (avoids icon library dependency) ---------- */

function FlagIcon() {
  return (
    <svg
      className="h-4 w-4 text-gray-500"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      className="h-4 w-4 text-gray-500"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
      />
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg
      className="h-4 w-4 text-gray-500"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}
