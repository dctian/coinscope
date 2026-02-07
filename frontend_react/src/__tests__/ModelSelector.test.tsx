import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ModelSelector, { MODELS, DEFAULT_MODEL } from "../components/ModelSelector";

describe("ModelSelector", () => {
  it("renders all three model options", () => {
    render(
      <ModelSelector
        selectedModel={DEFAULT_MODEL}
        onModelChange={() => {}}
      />,
    );

    for (const model of MODELS) {
      expect(screen.getByRole("radio", { name: model.label })).toBeInTheDocument();
    }
  });

  it("shows the selected model with aria-checked true", () => {
    render(
      <ModelSelector
        selectedModel="gemini-2.0-flash-lite"
        onModelChange={() => {}}
      />,
    );

    const flashLite = screen.getByRole("radio", { name: "Gemini Flash Lite" });
    expect(flashLite).toHaveAttribute("aria-checked", "true");

    const pro = screen.getByRole("radio", { name: "Gemini 3 Pro" });
    expect(pro).toHaveAttribute("aria-checked", "false");
  });

  it("calls onModelChange when clicking a different model", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ModelSelector
        selectedModel={DEFAULT_MODEL}
        onModelChange={onChange}
      />,
    );

    await user.click(screen.getByRole("radio", { name: "Gemini Flash Lite" }));
    expect(onChange).toHaveBeenCalledWith("gemini-2.0-flash-lite");
  });

  it("highlights the default model initially", () => {
    render(
      <ModelSelector
        selectedModel={DEFAULT_MODEL}
        onModelChange={() => {}}
      />,
    );

    const defaultButton = screen.getByRole("radio", { name: "Gemini 3 Pro" });
    expect(defaultButton).toHaveAttribute("aria-checked", "true");
    // The selected button should have the emerald background class
    expect(defaultButton.className).toContain("bg-emerald-600");
  });

  it("renders the AI Model label", () => {
    render(
      <ModelSelector
        selectedModel={DEFAULT_MODEL}
        onModelChange={() => {}}
      />,
    );

    expect(screen.getByText("AI Model")).toBeInTheDocument();
  });
});
