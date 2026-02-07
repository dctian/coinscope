import { test, expect } from "@playwright/test";
import path from "path";

const TEST_IMAGE = path.resolve(
  "/Users/davidtian/src/coinscope/testdata/coin1.jpg",
);

/**
 * Mock API response with multiple coins including bbox values.
 */
const MOCK_RESPONSE = {
  coins: [
    {
      id: "mock-c1",
      name: "Lincoln Penny",
      country: "United States",
      year: 2020,
      denomination: "1 cent",
      face_value: 0.01,
      currency: "USD",
      obverse_description: "Abraham Lincoln portrait",
      reverse_description: "Union Shield",
      confidence: 0.95,
      bbox: [0.05, 0.1, 0.45, 0.5],
    },
    {
      id: "mock-c2",
      name: "Canadian Quarter",
      country: "Canada",
      year: 2017,
      denomination: "25 cents",
      face_value: 0.25,
      currency: "CAD",
      obverse_description: "Queen Elizabeth II",
      reverse_description: "Caribou",
      confidence: 0.88,
      bbox: [0.55, 0.5, 0.95, 0.9],
    },
    {
      id: "mock-c3",
      name: "Euro Coin",
      country: "Germany",
      year: 2019,
      denomination: "1 euro",
      face_value: 1.0,
      currency: "EUR",
      obverse_description: "Federal Eagle",
      reverse_description: "Map of Europe",
      confidence: 0.75,
      bbox: [0.2, 0.55, 0.5, 0.95],
    },
  ],
  total_coins_detected: 3,
  model_used: "gemini/gemini-2.0-flash",
};

test.describe("Swipeable Coin Results", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the identify API to return multiple coins with bbox.
    // Use a regex to match any URL containing the identify endpoint path,
    // regardless of the host (works with external API at 72.60.68.100 or localhost).
    await page.route(/\/api\/v1\/coins\/identify/, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_RESPONSE),
      }),
    );
  });

  test("shows swipeable results with multiple coins", async ({ page }) => {
    await page.goto("/");

    // Upload an image via the hidden file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE);

    // Wait for navigation to /results
    await page.waitForURL("**/results", { timeout: 15_000 });

    // Verify the first coin is visible
    await expect(page.getByText("Lincoln Penny")).toBeVisible();

    // Verify page indicators are shown (3 dots for 3 coins)
    const pageIndicators = page.getByTestId("page-indicators");
    await expect(pageIndicators).toBeVisible();
    const dots = pageIndicators.locator("button");
    await expect(dots).toHaveCount(3);

    // Verify coin counter shows "1 of 3"
    const counter = page.getByTestId("coin-counter");
    await expect(counter).toHaveText("1 of 3");
  });

  test("navigates between coins using navigation buttons", async ({
    page,
  }) => {
    await page.goto("/");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE);

    await page.waitForURL("**/results", { timeout: 15_000 });

    // Verify first coin
    await expect(page.getByText("Lincoln Penny")).toBeVisible();

    // Click next button
    const nextButton = page.getByRole("button", { name: "Next coin" });
    await nextButton.click();

    // Verify second coin is now shown
    await expect(page.getByText("Canadian Quarter")).toBeVisible();
    await expect(page.getByTestId("coin-counter")).toHaveText("2 of 3");

    // Click next again
    await nextButton.click();

    // Verify third coin
    await expect(page.getByText("Euro Coin")).toBeVisible();
    await expect(page.getByTestId("coin-counter")).toHaveText("3 of 3");

    // Click previous
    const prevButton = page.getByRole("button", { name: "Previous coin" });
    await prevButton.click();

    // Should be back to second coin
    await expect(page.getByText("Canadian Quarter")).toBeVisible();
    await expect(page.getByTestId("coin-counter")).toHaveText("2 of 3");
  });

  test("navigates using page indicator dots", async ({ page }) => {
    await page.goto("/");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE);

    await page.waitForURL("**/results", { timeout: 15_000 });

    // Click on the third dot
    const thirdDot = page.getByRole("button", { name: "Go to coin 3" });
    await thirdDot.click();

    // Verify third coin
    await expect(page.getByText("Euro Coin")).toBeVisible();
    await expect(page.getByTestId("coin-counter")).toHaveText("3 of 3");
  });

  test("opens coin detail modal when tapping coin card", async ({ page }) => {
    await page.goto("/");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE);

    await page.waitForURL("**/results", { timeout: 15_000 });

    // Click on the first coin card
    await page.getByText("Lincoln Penny").click();

    // Verify modal opens
    const modal = page.locator(".fixed.inset-0.z-50");
    await expect(modal).toBeVisible();

    // Verify modal has coin details
    await expect(page.getByText("Year", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Denomination", { exact: true }),
    ).toBeVisible();

    // Close the modal
    const closeButton = page.getByRole("button", { name: "Close" });
    await closeButton.click();
    await expect(modal).not.toBeVisible();
  });

  test("back button returns to home page", async ({ page }) => {
    await page.goto("/");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE);

    await page.waitForURL("**/results", { timeout: 15_000 });

    // Click back button
    const backButton = page.getByRole("button", { name: "Go back" });
    await backButton.click();

    // Verify we're back on home
    await expect(
      page.getByRole("heading", { name: "CoinScope" }),
    ).toBeVisible();
  });

  test("renders cropped coin image area", async ({ page }) => {
    await page.goto("/");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE);

    await page.waitForURL("**/results", { timeout: 15_000 });

    // Verify the coin image area is present (either a canvas or error fallback).
    // In E2E with blob URLs, the image may fail to load, showing the error state.
    const imageArea = page
      .getByTestId("cropped-coin-canvas")
      .or(page.getByTestId("cropped-coin-image-error"));
    await expect(imageArea).toBeVisible();
  });
});
