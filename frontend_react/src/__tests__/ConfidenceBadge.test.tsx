import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ConfidenceBadge from "../components/ConfidenceBadge";

describe("ConfidenceBadge", () => {
  it("displays the percentage", () => {
    render(<ConfidenceBadge confidence={0.95} />);
    expect(screen.getByText("95%")).toBeInTheDocument();
  });

  it("rounds the percentage", () => {
    render(<ConfidenceBadge confidence={0.876} />);
    expect(screen.getByText("88%")).toBeInTheDocument();
  });

  it("renders green classes for >= 80%", () => {
    const { container } = render(<ConfidenceBadge confidence={0.85} />);
    const span = container.querySelector("span")!;
    expect(span.className).toContain("bg-green-100");
    expect(span.className).toContain("text-green-700");
  });

  it("renders orange classes for >= 60% and < 80%", () => {
    const { container } = render(<ConfidenceBadge confidence={0.65} />);
    const span = container.querySelector("span")!;
    expect(span.className).toContain("bg-orange-100");
    expect(span.className).toContain("text-orange-700");
  });

  it("renders red classes for < 60%", () => {
    const { container } = render(<ConfidenceBadge confidence={0.4} />);
    const span = container.querySelector("span")!;
    expect(span.className).toContain("bg-red-100");
    expect(span.className).toContain("text-red-700");
  });

  it("boundary: exactly 0.8 is green", () => {
    const { container } = render(<ConfidenceBadge confidence={0.8} />);
    const span = container.querySelector("span")!;
    expect(span.className).toContain("bg-green-100");
  });

  it("boundary: exactly 0.6 is orange", () => {
    const { container } = render(<ConfidenceBadge confidence={0.6} />);
    const span = container.querySelector("span")!;
    expect(span.className).toContain("bg-orange-100");
  });

  it("boundary: 0.59 is red", () => {
    const { container } = render(<ConfidenceBadge confidence={0.59} />);
    const span = container.querySelector("span")!;
    expect(span.className).toContain("bg-red-100");
  });

  it("displays 0% for confidence=0", () => {
    render(<ConfidenceBadge confidence={0} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("displays 100% for confidence=1", () => {
    render(<ConfidenceBadge confidence={1} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
