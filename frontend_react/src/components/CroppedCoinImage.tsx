import { useRef, useEffect, useState } from "react";

interface CroppedCoinImageProps {
  imageUrl: string;
  bbox: number[] | null | undefined;
}

/**
 * Displays a cropped region of the source image based on a normalized bounding box.
 *
 * bbox format: [x_min, y_min, x_max, y_max] where values are 0-1 (normalized).
 * If bbox is null/undefined, the full image is displayed.
 *
 * Uses a <canvas> element to draw only the cropped region.
 */
export default function CroppedCoinImage({
  imageUrl,
  bbox,
}: CroppedCoinImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (bbox && bbox.length === 4) {
        const [xMin, yMin, xMax, yMax] = bbox as [
          number,
          number,
          number,
          number,
        ];

        // Convert normalized coords to pixel coords
        const sx = Math.round(xMin * img.naturalWidth);
        const sy = Math.round(yMin * img.naturalHeight);
        const sw = Math.round((xMax - xMin) * img.naturalWidth);
        const sh = Math.round((yMax - yMin) * img.naturalHeight);

        // Add some padding (10%) but clamp within image bounds
        const padX = Math.round(sw * 0.1);
        const padY = Math.round(sh * 0.1);
        const cropX = Math.max(0, sx - padX);
        const cropY = Math.max(0, sy - padY);
        const cropW = Math.min(img.naturalWidth - cropX, sw + padX * 2);
        const cropH = Math.min(img.naturalHeight - cropY, sh + padY * 2);

        // Use the larger dimension as the canvas size for a square output
        const size = Math.max(cropW, cropH);
        canvas.width = size;
        canvas.height = size;

        // Fill with a neutral background for non-square crops
        ctx.fillStyle = "#f3f4f6";
        ctx.fillRect(0, 0, size, size);

        // Center the crop within the square canvas
        const offsetX = Math.round((size - cropW) / 2);
        const offsetY = Math.round((size - cropH) / 2);

        ctx.drawImage(
          img,
          cropX,
          cropY,
          cropW,
          cropH,
          offsetX,
          offsetY,
          cropW,
          cropH,
        );
      } else {
        // No bbox - show full image in a square canvas
        const size = Math.max(img.naturalWidth, img.naturalHeight);
        canvas.width = size;
        canvas.height = size;

        ctx.fillStyle = "#f3f4f6";
        ctx.fillRect(0, 0, size, size);

        const offsetX = Math.round((size - img.naturalWidth) / 2);
        const offsetY = Math.round((size - img.naturalHeight) / 2);

        ctx.drawImage(img, offsetX, offsetY);
      }

      setLoaded(true);
    };

    img.onerror = () => {
      setError(true);
    };

    img.src = imageUrl;
  }, [imageUrl, bbox]);

  if (error) {
    return (
      <div
        className="flex aspect-square w-full items-center justify-center rounded-2xl bg-gray-100"
        data-testid="cropped-coin-image-error"
      >
        <span className="text-sm text-gray-400">Image unavailable</span>
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100 shadow-md">
      <canvas
        ref={canvasRef}
        data-testid="cropped-coin-canvas"
        className={`h-full w-full object-contain transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
        </div>
      )}
    </div>
  );
}
