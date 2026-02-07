import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CoinCard from "../components/CoinCard";
import type { Coin } from "../types/coin";

const baseCoin: Coin = {
  id: "test-1",
  name: "Lincoln Penny",
  country: "United States",
  year: 2020,
  denomination: "1 cent",
  face_value: 0.01,
  currency: "USD",
  obverse_description: "Abraham Lincoln portrait",
  reverse_description: "Shield design",
  confidence: 0.95,
};

describe("CoinCard", () => {
  it("renders the coin name", () => {
    render(<CoinCard coin={baseCoin} onTap={() => {}} />);
    expect(screen.getByText("Lincoln Penny")).toBeInTheDocument();
  });

  it("renders the country", () => {
    render(<CoinCard coin={baseCoin} onTap={() => {}} />);
    expect(screen.getByText("United States")).toBeInTheDocument();
  });

  it("renders the year", () => {
    render(<CoinCard coin={baseCoin} onTap={() => {}} />);
    expect(screen.getByText("2020")).toBeInTheDocument();
  });

  it("renders denomination with currency", () => {
    render(<CoinCard coin={baseCoin} onTap={() => {}} />);
    expect(screen.getByText("1 cent (USD)")).toBeInTheDocument();
  });

  it("renders 'Unknown year' when year is null", () => {
    const coin: Coin = { ...baseCoin, year: null };
    render(<CoinCard coin={coin} onTap={() => {}} />);
    expect(screen.getByText("Unknown year")).toBeInTheDocument();
  });

  it("fires onTap when clicked", () => {
    const handleTap = vi.fn();
    render(<CoinCard coin={baseCoin} onTap={handleTap} />);

    fireEvent.click(screen.getByRole("button"));
    expect(handleTap).toHaveBeenCalledTimes(1);
  });

  it("renders obverse description", () => {
    render(<CoinCard coin={baseCoin} onTap={() => {}} />);
    expect(screen.getByText("Abraham Lincoln portrait")).toBeInTheDocument();
  });

  it("renders reverse description", () => {
    render(<CoinCard coin={baseCoin} onTap={() => {}} />);
    expect(screen.getByText("Shield design")).toBeInTheDocument();
  });

  it("hides descriptions when both are null", () => {
    const coin: Coin = {
      ...baseCoin,
      obverse_description: null,
      reverse_description: null,
    };
    render(<CoinCard coin={coin} onTap={() => {}} />);
    expect(screen.queryByText("Front:")).not.toBeInTheDocument();
    expect(screen.queryByText("Back:")).not.toBeInTheDocument();
  });
});
