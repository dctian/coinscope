interface ConfidenceBadgeProps {
  confidence: number;
}

/**
 * Colored badge showing the AI confidence percentage.
 * Green >= 80%, orange >= 60%, red < 60%.
 */
export default function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const percent = Math.round(confidence * 100);

  let colorClasses: string;
  if (confidence >= 0.8) {
    colorClasses = "bg-green-100 text-green-700 border-green-300";
  } else if (confidence >= 0.6) {
    colorClasses = "bg-orange-100 text-orange-700 border-orange-300";
  } else {
    colorClasses = "bg-red-100 text-red-700 border-red-300";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-bold ${colorClasses}`}
    >
      {percent}%
    </span>
  );
}
