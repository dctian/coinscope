import { useState, useRef, useCallback } from "react";
import type { Coin } from "../types/coin";
import CroppedCoinImage from "./CroppedCoinImage";
import CoinCard from "./CoinCard";
import CoinDetailModal from "./CoinDetailModal";

interface SwipeableResultsProps {
  coins: Coin[];
  imageUrl: string;
  modelUsed: string;
}

/**
 * Horizontal swipeable coin result pages.
 * Shows one coin at a time with touch-based left/right navigation.
 */
export default function SwipeableResults({
  coins,
  imageUrl,
  modelUsed,
}: SwipeableResultsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const SWIPE_THRESHOLD = 50;

  const modelShortName = modelUsed.split("/").pop() ?? modelUsed;

  const goToPage = useCallback(
    (index: number) => {
      if (index >= 0 && index < coins.length) {
        setCurrentIndex(index);
      }
    },
    [coins.length],
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isHorizontalSwipe.current = null;
    setIsSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    const diffX = touch.clientX - touchStartX.current;
    const diffY = touch.clientY - touchStartY.current;

    // Determine swipe direction on first significant movement
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
        isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    if (isHorizontalSwipe.current) {
      setTranslateX(diffX);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsSwiping(false);

    if (isHorizontalSwipe.current) {
      if (translateX < -SWIPE_THRESHOLD && currentIndex < coins.length - 1) {
        // Swiped left -> next page
        setCurrentIndex((prev) => prev + 1);
      } else if (translateX > SWIPE_THRESHOLD && currentIndex > 0) {
        // Swiped right -> previous page
        setCurrentIndex((prev) => prev - 1);
      }
    }

    setTranslateX(0);
    isHorizontalSwipe.current = null;
  }, [translateX, currentIndex, coins.length]);

  const currentCoin = coins[currentIndex];

  if (!currentCoin) return null;

  return (
    <>
      <div className="flex-1 px-4 pb-8">
        {/* Counter + model badge */}
        <div className="mt-2 flex items-center justify-between">
          <h2
            className="text-base font-bold text-gray-900"
            data-testid="coin-counter"
          >
            {currentIndex + 1} of {coins.length}
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

        {/* Swipeable area */}
        <div
          className="mt-4 touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          data-testid="swipeable-container"
        >
          <div
            className={`${!isSwiping ? "transition-transform duration-300 ease-out" : ""}`}
            style={{ transform: `translateX(${translateX}px)` }}
          >
            {/* Cropped coin image */}
            <div className="mx-auto max-w-xs">
              <CroppedCoinImage imageUrl={imageUrl} bbox={currentCoin.bbox} />
            </div>

            {/* Coin card */}
            <div className="mt-4">
              <CoinCard
                coin={currentCoin}
                onTap={() => setSelectedCoin(currentCoin)}
              />
            </div>
          </div>
        </div>

        {/* Page indicator dots */}
        <div
          className="mt-6 flex items-center justify-center gap-2"
          data-testid="page-indicators"
        >
          {coins.map((coin, index) => (
            <button
              key={coin.id}
              type="button"
              onClick={() => goToPage(index)}
              aria-label={`Go to coin ${index + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-6 bg-emerald-600"
                  : "w-2.5 bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>

        {/* Navigation arrows for desktop/accessibility */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => goToPage(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Previous coin"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => goToPage(currentIndex + 1)}
            disabled={currentIndex === coins.length - 1}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Next coin"
          >
            <svg
              className="h-6 w-6"
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
        </div>
      </div>

      {/* Detail modal */}
      {selectedCoin && (
        <CoinDetailModal
          coin={selectedCoin}
          onClose={() => setSelectedCoin(null)}
        />
      )}
    </>
  );
}
