import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import HomePage from "../pages/HomePage";

// Wrap component with all necessary providers
function renderHomePage() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/"]}>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("HomePage", () => {
  it("renders the CoinScope title", () => {
    renderHomePage();
    expect(screen.getByText("CoinScope")).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    renderHomePage();
    expect(
      screen.getByText("Identify coins instantly with AI"),
    ).toBeInTheDocument();
  });

  it("renders the Take Photo button", () => {
    renderHomePage();
    expect(
      screen.getByRole("button", { name: /take photo/i }),
    ).toBeInTheDocument();
  });

  it("renders the Choose from Gallery button", () => {
    renderHomePage();
    expect(
      screen.getByRole("button", { name: /choose from gallery/i }),
    ).toBeInTheDocument();
  });

  it("has a hidden file input for gallery", () => {
    const { container } = renderHomePage();
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeTruthy();
    expect(fileInput!.className).toContain("hidden");
  });

  it("renders instructions card", () => {
    renderHomePage();
    expect(
      screen.getByText("Take a photo of your coins"),
    ).toBeInTheDocument();
  });

  it("renders the model selector with all options", () => {
    renderHomePage();
    expect(screen.getByRole("radiogroup", { name: /select ai model/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Gemini 3 Pro" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Gemini Flash" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Gemini Flash Lite" })).toBeInTheDocument();
  });

  it("has Gemini 3 Pro selected by default", () => {
    renderHomePage();
    const pro = screen.getByRole("radio", { name: "Gemini 3 Pro" });
    expect(pro).toHaveAttribute("aria-checked", "true");
  });

  it("allows selecting a different model", async () => {
    const user = userEvent.setup();
    renderHomePage();

    const flashLite = screen.getByRole("radio", { name: "Gemini Flash Lite" });
    await user.click(flashLite);
    expect(flashLite).toHaveAttribute("aria-checked", "true");

    const pro = screen.getByRole("radio", { name: "Gemini 3 Pro" });
    expect(pro).toHaveAttribute("aria-checked", "false");
  });
});
