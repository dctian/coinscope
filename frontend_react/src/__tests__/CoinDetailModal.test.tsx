import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CoinDetailModal from "../components/CoinDetailModal";
import type { Coin } from "../types/coin";

const testCoin: Coin = {
  id: "test-1",
  name: "Quarter Dollar",
  country: "United States",
  year: 2019,
  denomination: "25 cents",
  face_value: 0.25,
  currency: "USD",
  obverse_description: "George Washington portrait",
  reverse_description: "Eagle design",
  confidence: 0.92,
};

describe("CoinDetailModal", () => {
  it("renders the coin name", () => {
    render(<CoinDetailModal coin={testCoin} onClose={() => {}} />);
    expect(screen.getByText("Quarter Dollar")).toBeInTheDocument();
  });

  it("renders the country", () => {
    render(<CoinDetailModal coin={testCoin} onClose={() => {}} />);
    expect(screen.getByText("United States")).toBeInTheDocument();
  });

  it("renders the year", () => {
    render(<CoinDetailModal coin={testCoin} onClose={() => {}} />);
    expect(screen.getByText("2019")).toBeInTheDocument();
  });

  it("renders the denomination", () => {
    render(<CoinDetailModal coin={testCoin} onClose={() => {}} />);
    expect(screen.getByText("25 cents")).toBeInTheDocument();
  });

  it("renders the currency", () => {
    render(<CoinDetailModal coin={testCoin} onClose={() => {}} />);
    expect(screen.getByText("USD")).toBeInTheDocument();
  });

  it("renders face value formatted to 2 decimals", () => {
    render(<CoinDetailModal coin={testCoin} onClose={() => {}} />);
    expect(screen.getByText("0.25")).toBeInTheDocument();
  });

  it("renders obverse description", () => {
    render(<CoinDetailModal coin={testCoin} onClose={() => {}} />);
    expect(screen.getByText("George Washington portrait")).toBeInTheDocument();
  });

  it("renders reverse description", () => {
    render(<CoinDetailModal coin={testCoin} onClose={() => {}} />);
    expect(screen.getByText("Eagle design")).toBeInTheDocument();
  });

  it("renders 'Unknown' for null year", () => {
    const coin: Coin = { ...testCoin, year: null };
    render(<CoinDetailModal coin={coin} onClose={() => {}} />);
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("renders 'N/A' for null face_value", () => {
    const coin: Coin = { ...testCoin, face_value: null };
    render(<CoinDetailModal coin={coin} onClose={() => {}} />);
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("calls onClose when Escape is pressed", () => {
    const handleClose = vi.fn();
    render(<CoinDetailModal coin={testCoin} onClose={handleClose} />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", () => {
    const handleClose = vi.fn();
    const { container } = render(
      <CoinDetailModal coin={testCoin} onClose={handleClose} />,
    );

    // The backdrop is the div with aria-hidden="true"
    const backdrop = container.querySelector('[aria-hidden="true"]')!;
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(<CoinDetailModal coin={testCoin} onClose={handleClose} />);

    const closeBtn = screen.getByLabelText("Close");
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("sets body overflow to hidden when mounted", () => {
    render(<CoinDetailModal coin={testCoin} onClose={() => {}} />);
    expect(document.body.style.overflow).toBe("hidden");
  });
});
