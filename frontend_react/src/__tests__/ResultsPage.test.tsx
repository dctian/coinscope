import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Coin, ResultsLocationState } from "../types/coin";
import ResultsPage from "../pages/ResultsPage";

// ---------------------------------------------------------------------------
// Mocking react-router-dom hooks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
let mockLocationState: ResultsLocationState | null = null;

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      state: mockLocationState,
      pathname: "/results",
      search: "",
      hash: "",
      key: "default",
    }),
  };
});

// ---------------------------------------------------------------------------
// Helpers
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
  },
];

function renderResultsPage() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/results"]}>
        <ResultsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ResultsPage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLocationState = null;
  });

  it("redirects to home when no state is present", () => {
    mockLocationState = null;
    renderResultsPage();
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("renders coins when state is provided", () => {
    mockLocationState = {
      coins: sampleCoins,
      totalCoinsDetected: 2,
      modelUsed: "gemini/gemini-flash-latest",
      imageUrl: "blob:http://localhost/fake",
    };

    renderResultsPage();

    expect(screen.getByText("Lincoln Penny")).toBeInTheDocument();
    expect(screen.getByText("Canadian Quarter")).toBeInTheDocument();
  });

  it("shows coin count header", () => {
    mockLocationState = {
      coins: sampleCoins,
      totalCoinsDetected: 2,
      modelUsed: "gemini/gemini-flash-latest",
      imageUrl: "blob:http://localhost/fake",
    };

    renderResultsPage();

    expect(screen.getByText("2 Coins Found")).toBeInTheDocument();
  });

  it("shows singular 'Coin' for single result", () => {
    mockLocationState = {
      coins: [sampleCoins[0]!],
      totalCoinsDetected: 1,
      modelUsed: "test-model",
      imageUrl: "blob:http://localhost/fake",
    };

    renderResultsPage();

    expect(screen.getByText("1 Coin Found")).toBeInTheDocument();
  });

  it("shows empty state when coins array is empty", () => {
    mockLocationState = {
      coins: [],
      totalCoinsDetected: 0,
      modelUsed: "test-model",
      imageUrl: "blob:http://localhost/fake",
    };

    renderResultsPage();

    expect(screen.getByText("No Coins Detected")).toBeInTheDocument();
  });

  it("shows model short name", () => {
    mockLocationState = {
      coins: sampleCoins,
      totalCoinsDetected: 2,
      modelUsed: "gemini/gemini-flash-latest",
      imageUrl: "blob:http://localhost/fake",
    };

    renderResultsPage();

    expect(screen.getByText("gemini-flash-latest")).toBeInTheDocument();
  });

  it("has a Results header", () => {
    mockLocationState = {
      coins: sampleCoins,
      totalCoinsDetected: 2,
      modelUsed: "test-model",
      imageUrl: "blob:http://localhost/fake",
    };

    renderResultsPage();

    expect(screen.getByText("Results")).toBeInTheDocument();
  });

  it("shows Try Again button in empty state", () => {
    mockLocationState = {
      coins: [],
      totalCoinsDetected: 0,
      modelUsed: "test-model",
      imageUrl: "blob:http://localhost/fake",
    };

    renderResultsPage();

    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });
});
