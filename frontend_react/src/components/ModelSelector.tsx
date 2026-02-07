/** Available VLM models for coin identification. */
export const MODELS = [
  {
    id: "gemini-3-pro-preview",
    label: "Gemini 3 Pro",
    description: "Most capable",
  },
  {
    id: "gemini-2.5-flash-preview-05-20",
    label: "Gemini Flash",
    description: "Fast & accurate",
  },
  {
    id: "gemini-2.0-flash-lite",
    label: "Gemini Flash Lite",
    description: "Fastest",
  },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];

export const DEFAULT_MODEL: ModelId = "gemini-3-pro-preview";

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export default function ModelSelector({
  selectedModel,
  onModelChange,
}: ModelSelectorProps) {
  return (
    <div className="mt-6" role="radiogroup" aria-label="Select AI model">
      <p className="mb-2 text-center text-xs font-medium uppercase tracking-wider text-gray-400">
        AI Model
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {MODELS.map((model) => {
          const isSelected = selectedModel === model.id;
          return (
            <button
              key={model.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onModelChange(model.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isSelected
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "border border-gray-300 bg-white text-gray-600 hover:border-emerald-400 hover:text-emerald-600"
              }`}
            >
              {model.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
