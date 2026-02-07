import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import HistoryPage from "../pages/HistoryPage";
import type { SearchHistoryEntry } from "../types/history";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useHistory hook
const mockClearAll = vi.fn().mockResolvedValue(undefined);
let mockEntries: SearchHistoryEntry[] = [];
let mockLoading = false;

vi.mock("../hooks/useHistory", () => ({
  useHistory: () => ({
    entries: mockEntries,
    loading: mockLoading,
    saveSearch: vi.fn(),
    deleteEntry: vi.fn(),
    clearAll: mockClearAll,
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFakeEntry(overrides: Partial<SearchHistoryEntry> = {}): SearchHistoryEntry {
  return {
    id: "entry-1",
    timestamp: new Date("2025-06-15T10:30:00").getTime(),
    imageBlob: new Blob(["fake-image"], { type: "image/jpeg" }),
    coins: [
      {
        id: "c1",
        name: "Lincoln Penny",
        country: "United States",
        year: 2020,
        denomination: "1 cent",
        face_value: 0.01,
        currency: "USD",
        obverse_description: null,
        reverse_description: null,
        confidence: 0.95,
      },
    ],
    totalCoinsDetected: 1,
    modelUsed: "gemini/gemini-flash-latest",
    ...overrides,
  };
}

function renderHistoryPage() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/history"]}>
        <HistoryPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("HistoryPage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockClearAll.mockClear();
    mockEntries = [];
    mockLoading = false;
  });

  it("shows empty state when no history entries exist", () => {
    mockEntries = [];
    renderHistoryPage();

    expect(screen.getByText("No Search History")).toBeInTheDocument();
    expect(
      screen.getByText("Your past coin searches will appear here."),
    ).toBeInTheDocument();
  });

  it("shows an Identify Coins button in empty state", () => {
    mockEntries = [];
    renderHistoryPage();

    expect(
      screen.getByRole("button", { name: /identify coins/i }),
    ).toBeInTheDocument();
  });

  it("shows history entries with coin name", () => {
    mockEntries = [makeFakeEntry()];
    renderHistoryPage();

    expect(screen.getByText("Lincoln Penny")).toBeInTheDocument();
  });

  it("shows coin count in each entry", () => {
    mockEntries = [makeFakeEntry({ totalCoinsDetected: 3 })];
    renderHistoryPage();

    expect(screen.getByText("3 coins found")).toBeInTheDocument();
  });

  it("shows singular coin text for 1 coin", () => {
    mockEntries = [makeFakeEntry({ totalCoinsDetected: 1 })];
    renderHistoryPage();

    expect(screen.getByText("1 coin found")).toBeInTheDocument();
  });

  it("shows model short name", () => {
    mockEntries = [makeFakeEntry({ modelUsed: "gemini/gemini-flash-latest" })];
    renderHistoryPage();

    expect(screen.getByText("gemini-flash-latest")).toBeInTheDocument();
  });

  it("has a Search History header", () => {
    mockEntries = [];
    renderHistoryPage();

    expect(screen.getByText("Search History")).toBeInTheDocument();
  });

  it("has a back button", () => {
    renderHistoryPage();

    expect(
      screen.getByRole("button", { name: /go back/i }),
    ).toBeInTheDocument();
  });

  it("shows Clear History button when entries exist", () => {
    mockEntries = [makeFakeEntry()];
    renderHistoryPage();

    expect(screen.getByTestId("clear-history-button")).toBeInTheDocument();
  });

  it("shows confirmation when Clear History is clicked", async () => {
    const user = userEvent.setup();
    mockEntries = [makeFakeEntry()];
    renderHistoryPage();

    await user.click(screen.getByTestId("clear-history-button"));

    expect(screen.getByText("Clear all history?")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /confirm/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /cancel/i }),
    ).toBeInTheDocument();
  });

  it("navigates to results when an entry is clicked", async () => {
    const user = userEvent.setup();
    mockEntries = [makeFakeEntry()];
    renderHistoryPage();

    await user.click(screen.getByText("Lincoln Penny"));

    expect(mockNavigate).toHaveBeenCalledWith("/results", {
      state: expect.objectContaining({
        coins: expect.arrayContaining([
          expect.objectContaining({ name: "Lincoln Penny" }),
        ]),
        totalCoinsDetected: 1,
        modelUsed: "gemini/gemini-flash-latest",
      }),
    });
  });

  it("renders multiple entries", () => {
    mockEntries = [
      makeFakeEntry({ id: "e1" }),
      makeFakeEntry({
        id: "e2",
        coins: [
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
          },
        ],
      }),
    ];
    renderHistoryPage();

    expect(screen.getByText("Lincoln Penny")).toBeInTheDocument();
    expect(screen.getByText("Canadian Quarter")).toBeInTheDocument();
  });
});
