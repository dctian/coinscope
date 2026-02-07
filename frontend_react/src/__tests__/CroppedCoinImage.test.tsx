import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import CroppedCoinImage from "../components/CroppedCoinImage";

// ---------------------------------------------------------------------------
// Mock the Image constructor so we can control onload/onerror
// ---------------------------------------------------------------------------

let mockImageInstances: Array<{
  src: string;
  crossOrigin: string;
  onload: (() => void) | null;
  onerror: (() => void) | null;
  naturalWidth: number;
  naturalHeight: number;
}> = [];

beforeEach(() => {
  mockImageInstances = [];

  vi.stubGlobal(
    "Image",
    class MockImage {
      src = "";
      crossOrigin = "";
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      naturalWidth = 1000;
      naturalHeight = 800;

      constructor() {
        mockImageInstances.push(this);
      }
    },
  );
});

// ---------------------------------------------------------------------------
// Mock canvas context
// ---------------------------------------------------------------------------
const mockFillRect = vi.fn();
const mockDrawImage = vi.fn();

HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillRect: mockFillRect,
  drawImage: mockDrawImage,
  fillStyle: "",
}) as unknown as typeof HTMLCanvasElement.prototype.getContext;

beforeEach(() => {
  mockFillRect.mockClear();
  mockDrawImage.mockClear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CroppedCoinImage", () => {
  it("renders a canvas element", () => {
    render(<CroppedCoinImage imageUrl="test.jpg" bbox={null} />);
    expect(screen.getByTestId("cropped-coin-canvas")).toBeInTheDocument();
  });

  it("renders with bbox - draws cropped region onto canvas", async () => {
    render(
      <CroppedCoinImage
        imageUrl="test.jpg"
        bbox={[0.1, 0.2, 0.5, 0.8]}
      />,
    );

    // Trigger image load
    const img = mockImageInstances[0];
    expect(img).toBeDefined();
    img!.onload?.();

    await waitFor(() => {
      expect(mockDrawImage).toHaveBeenCalled();
    });

    // The canvas should have been set up (drawImage called once for the crop)
    expect(mockDrawImage).toHaveBeenCalledTimes(1);
  });

  it("renders without bbox - draws full image", async () => {
    render(<CroppedCoinImage imageUrl="test.jpg" bbox={undefined} />);

    const img = mockImageInstances[0];
    expect(img).toBeDefined();
    img!.onload?.();

    await waitFor(() => {
      expect(mockDrawImage).toHaveBeenCalled();
    });

    // Should draw the full image once
    expect(mockDrawImage).toHaveBeenCalledTimes(1);
  });

  it("handles null bbox same as undefined", async () => {
    render(<CroppedCoinImage imageUrl="test.jpg" bbox={null} />);

    const img = mockImageInstances[0];
    expect(img).toBeDefined();
    img!.onload?.();

    await waitFor(() => {
      expect(mockDrawImage).toHaveBeenCalled();
    });

    expect(mockDrawImage).toHaveBeenCalledTimes(1);
  });

  it("shows error state when image fails to load", async () => {
    render(<CroppedCoinImage imageUrl="bad-url.jpg" bbox={null} />);

    const img = mockImageInstances[0];
    expect(img).toBeDefined();
    img!.onerror?.();

    await waitFor(() => {
      expect(
        screen.getByTestId("cropped-coin-image-error"),
      ).toBeInTheDocument();
    });
  });

  it("shows loading spinner before image loads", () => {
    render(<CroppedCoinImage imageUrl="test.jpg" bbox={null} />);

    // The canvas should be present but with opacity-0
    const canvas = screen.getByTestId("cropped-coin-canvas");
    expect(canvas).toHaveClass("opacity-0");
  });
});
