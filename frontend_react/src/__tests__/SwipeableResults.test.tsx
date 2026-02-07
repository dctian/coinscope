import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SwipeableResults from "../components/SwipeableResults";
import type { Coin } from "../types/coin";

// ---------------------------------------------------------------------------
// Mock canvas and Image to prevent errors in jsdom
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

HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillRect: vi.fn(),
  drawImage: vi.fn(),
  fillStyle: "",
}) as unknown as typeof HTMLCanvasElement.prototype.getContext;

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const sampleCoins: Coin[] = [
  {
    id: "c1",
    name: "Lincoln Penny",
    country: "United States",
    year: 2020,
    denomination: "1 cent",
    face_value: 0.01,
    currency: "USD",
    obverse_description: "Lincoln portrait",
    reverse_description: "Shield",
    confidence: 0.95,
    bbox: [0.1, 0.1, 0.4, 0.4],
  },
  {
    id: "c2",
    name: "Canadian Quarter",
    country: "Canada",
    year: 2017,
    denomination: "25 cents",
    face_value: 0.25,
    currency: "CAD",
    obverse_description: null,
    reverse_description: null,
    confidence: 0.88,
    bbox: [0.5, 0.5, 0.9, 0.9],
  },
  {
    id: "c3",
    name: "Euro Coin",
    country: "Germany",
    year: 2019,
    denomination: "1 euro",
    face_value: 1.0,
    currency: "EUR",
    obverse_description: "Eagle",
    reverse_description: "Map",
    confidence: 0.75,
    bbox: [0.2, 0.6, 0.5, 0.95],
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SwipeableResults", () => {
  it("renders first coin by default", () => {
    render(
      <SwipeableResults
        coins={sampleCoins}
        imageUrl="test.jpg"
        modelUsed="gemini/gemini-flash-latest"
      />,
    );

    expect(screen.getByText("Lincoln Penny")).toBeInTheDocument();
  });

  it("shows page indicator dots matching coin count", () => {
    render(
      <SwipeableResults
        coins={sampleCoins}
        imageUrl="test.jpg"
        modelUsed="test-model"
      />,
    );

    const indicators = screen.getByTestId("page-indicators");
    // Each coin gets a dot button
    const dots = indicators.querySelectorAll("button");
    expect(dots).toHaveLength(3);
  });

  it('shows "1 of N" counter', () => {
    render(
      <SwipeableResults
        coins={sampleCoins}
        imageUrl="test.jpg"
        modelUsed="test-model"
      />,
    );

    expect(screen.getByTestId("coin-counter")).toHaveTextContent("1 of 3");
  });

  it("shows model short name", () => {
    render(
      <SwipeableResults
        coins={sampleCoins}
        imageUrl="test.jpg"
        modelUsed="gemini/gemini-flash-latest"
      />,
    );

    expect(screen.getByText("gemini-flash-latest")).toBeInTheDocument();
  });

  it("navigates to next coin when clicking next button", async () => {
    const user = userEvent.setup();

    render(
      <SwipeableResults
        coins={sampleCoins}
        imageUrl="test.jpg"
        modelUsed="test-model"
      />,
    );

    // Click the "Next coin" button
    const nextButton = screen.getByRole("button", { name: /next coin/i });
    await user.click(nextButton);

    expect(screen.getByText("Canadian Quarter")).toBeInTheDocument();
    expect(screen.getByTestId("coin-counter")).toHaveTextContent("2 of 3");
  });

  it("navigates to previous coin when clicking previous button", async () => {
    const user = userEvent.setup();

    render(
      <SwipeableResults
        coins={sampleCoins}
        imageUrl="test.jpg"
        modelUsed="test-model"
      />,
    );

    // Go to second coin first
    const nextButton = screen.getByRole("button", { name: /next coin/i });
    await user.click(nextButton);
    expect(screen.getByTestId("coin-counter")).toHaveTextContent("2 of 3");

    // Go back
    const prevButton = screen.getByRole("button", { name: /previous coin/i });
    await user.click(prevButton);

    expect(screen.getByText("Lincoln Penny")).toBeInTheDocument();
    expect(screen.getByTestId("coin-counter")).toHaveTextContent("1 of 3");
  });

  it("disables previous button on first coin", () => {
    render(
      <SwipeableResults
        coins={sampleCoins}
        imageUrl="test.jpg"
        modelUsed="test-model"
      />,
    );

    const prevButton = screen.getByRole("button", { name: /previous coin/i });
    expect(prevButton).toBeDisabled();
  });

  it("navigates to specific coin when clicking a page indicator dot", async () => {
    const user = userEvent.setup();

    render(
      <SwipeableResults
        coins={sampleCoins}
        imageUrl="test.jpg"
        modelUsed="test-model"
      />,
    );

    // Click the third dot
    const thirdDot = screen.getByRole("button", { name: "Go to coin 3" });
    await user.click(thirdDot);

    expect(screen.getByText("Euro Coin")).toBeInTheDocument();
    expect(screen.getByTestId("coin-counter")).toHaveTextContent("3 of 3");
  });

  it("has a swipeable container", () => {
    render(
      <SwipeableResults
        coins={sampleCoins}
        imageUrl="test.jpg"
        modelUsed="test-model"
      />,
    );

    expect(screen.getByTestId("swipeable-container")).toBeInTheDocument();
  });
});
