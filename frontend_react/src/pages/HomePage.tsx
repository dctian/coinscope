import { useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import Layout from "../components/Layout";
import ModelSelector, { DEFAULT_MODEL } from "../components/ModelSelector";
import { useIdentifyCoins } from "../hooks/useIdentifyCoins";
import { useHistory } from "../hooks/useHistory";
import type { ResultsLocationState } from "../types/coin";

const MODEL_STORAGE_KEY = "coinscope_selected_model";

function loadSavedModel(): string {
  try {
    return localStorage.getItem(MODEL_STORAGE_KEY) || DEFAULT_MODEL;
  } catch {
    return DEFAULT_MODEL;
  }
}

export default function HomePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(loadSavedModel);

  const { mutate, isPending } = useIdentifyCoins();
  const { entries: historyEntries, saveSearch } = useHistory();

  const handleModelChange = useCallback((model: string) => {
    setSelectedModel(model);
    try {
      localStorage.setItem(MODEL_STORAGE_KEY, model);
    } catch {
      // localStorage unavailable — ignore silently
    }
  }, []);

  /** Send a File to the API and navigate to results on success. */
  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      mutate({ file, model: selectedModel }, {
        onSuccess: async (data) => {
          // Save to history before navigating
          try {
            await saveSearch(
              file,
              data.coins,
              data.total_coins_detected,
              data.model_used,
            );
          } catch {
            // History save failure should not block navigation
          }

          // Create an object URL for the image preview on the results page
          const imageUrl = URL.createObjectURL(file);
          const state: ResultsLocationState = {
            coins: data.coins,
            totalCoinsDetected: data.total_coins_detected,
            modelUsed: data.model_used,
            imageUrl,
          };
          navigate("/results", { state });
        },
        onError: (err) => {
          setError(err.message || "Failed to identify coins. Please try again.");
        },
      });
    },
    [mutate, navigate, saveSearch, selectedModel],
  );

  /** Handle file input change (gallery pick). */
  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [handleFile],
  );

  /** Open file picker. */
  const openGallery = useCallback(() => {
    fileInputRef.current?.click();
  }, []);


  /** Open the native camera via Capacitor Camera plugin. */
  const openCamera = useCallback(async () => {
    setError(null);

    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        width: 2048,
        height: 2048,
      });

      if (photo.webPath) {
        const response = await fetch(photo.webPath);
        const blob = await response.blob();
        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
        handleFile(file);
      }
    } catch {
      // Camera not available or user cancelled — fall back to file picker with capture
      fileInputRef.current?.setAttribute("capture", "environment");
      fileInputRef.current?.click();
    }
  }, [handleFile]);


  return (
    <Layout>
      {/* Hidden file input for gallery pick */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Main content */}
      <div className="flex min-h-screen flex-col px-6 py-8">
        {/* Header */}
        <header className="relative flex flex-col items-center pt-6">
          {/* History button — only shown when there are past searches */}
          {historyEntries.length > 0 && (
            <button
              type="button"
              onClick={() => navigate("/history")}
              className="absolute right-0 top-6 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Search history"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </button>
          )}
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 shadow-lg shadow-emerald-600/30">
            <svg
              className="h-11 w-11 text-white"
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
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            CoinScope
          </h1>
          <p className="mt-2 text-base text-gray-500">
            Identify coins instantly with AI
          </p>
        </header>

        {/* Body */}
        <div className="mt-10 flex flex-1 flex-col">
          {/* Error banner */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 p-4">
              <svg
                className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
              <p className="flex-1 text-sm text-red-700">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="shrink-0 text-red-400 hover:text-red-600"
                aria-label="Dismiss error"
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
          )}

          {/* Loading state */}
          {isPending ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-6">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900">
                  Analyzing coins...
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  This may take a few seconds
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Instructions card */}
              <div className="rounded-3xl border border-gray-200/80 bg-white/60 p-6 text-center backdrop-blur-sm">
                <svg
                  className="mx-auto h-12 w-12 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
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
                <h2 className="mt-4 text-lg font-semibold text-gray-900">
                  Take a photo of your coins
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Position coins on a flat surface with good lighting for best
                  results
                </p>
              </div>

              {/* Model selector */}
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={handleModelChange}
              />

              {/* Action buttons */}
              <div className="mt-8 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={openCamera}
                  className="btn-primary"
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
                  Take Photo
                </button>

                <button
                  type="button"
                  onClick={openGallery}
                  className="btn-outline"
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
                      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M2.25 18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V6a2.25 2.25 0 0 0-2.25-2.25H4.5A2.25 2.25 0 0 0 2.25 6v12Z"
                    />
                  </svg>
                  Choose from Gallery
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
