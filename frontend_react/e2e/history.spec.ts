import { test, expect } from "@playwright/test";

const MOCK_COIN_RESPONSE = {
  coins: [
    {
      id: "test-coin-1",
      name: "Test Quarter",
      country: "United States",
      year: 2020,
      denomination: "Quarter Dollar",
      face_value: 0.25,
      currency: "USD",
      obverse_description: "George Washington",
      reverse_description: "Eagle",
      confidence: 0.95,
    },
  ],
  total_coins_detected: 1,
  model_used: "test/test-model",
};

test.describe("Search History", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API endpoint (use glob that matches with or without query params)
    await page.route("**/api/v1/coins/identify**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_COIN_RESPONSE),
      }),
    );
  });

  test("saves search to history and allows loading from history without API call", async ({
    page,
  }) => {
    // 1. Go to home page
    await page.goto("/");
    await expect(page.getByText("CoinScope")).toBeVisible();

    // 2. Upload an image to trigger identification
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(
      "/Users/davidtian/src/coinscope/testdata/coin1.jpg",
    );

    // 3. Wait for results page
    await page.waitForURL("**/results", { timeout: 15_000 });
    await expect(page.getByText("Test Quarter")).toBeVisible();
    await expect(page.getByText(/1 coin found/i)).toBeVisible();

    // 4. Navigate back to home
    await page.getByRole("button", { name: /go back/i }).click();
    await page.waitForURL("/");

    // 5. Verify history button is now visible
    const historyButton = page.getByRole("button", {
      name: /search history/i,
    });
    await expect(historyButton).toBeVisible({ timeout: 5_000 });

    // 6. Click history button to go to history page
    await historyButton.click();
    await page.waitForURL("**/history");

    // 7. Verify the past search appears in history
    await expect(page.getByText("Search History")).toBeVisible();
    await expect(page.getByText("Test Quarter")).toBeVisible();
    await expect(page.getByText("1 coin found")).toBeVisible();
    await expect(page.getByText("test-model")).toBeVisible();

    // 8. Block the API to prove no second call is made when loading from history
    let apiCallCount = 0;
    await page.route("**/api/v1/coins/identify", (route) => {
      apiCallCount++;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_COIN_RESPONSE),
      });
    });

    // 9. Click the history entry to load results
    await page.getByText("Test Quarter").click();
    await page.waitForURL("**/results");

    // 10. Verify results loaded from history (same data shown)
    await expect(page.getByText("Test Quarter")).toBeVisible();
    await expect(page.getByText(/1 coin found/i)).toBeVisible();

    // 11. Verify no API call was made
    expect(apiCallCount).toBe(0);
  });

  test("history page shows empty state when no searches exist", async ({
    page,
  }) => {
    await page.goto("/history");
    await expect(page.getByText("No Search History")).toBeVisible();
    await expect(
      page.getByText("Your past coin searches will appear here."),
    ).toBeVisible();
  });

  test("history button is not visible on home page when no history exists", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText("CoinScope")).toBeVisible();

    // History button should not be visible
    const historyButton = page.getByRole("button", {
      name: /search history/i,
    });
    await expect(historyButton).not.toBeVisible();
  });

  test("clear history removes all entries", async ({ page }) => {
    // First, create a history entry
    await page.goto("/");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(
      "/Users/davidtian/src/coinscope/testdata/coin1.jpg",
    );
    await page.waitForURL("**/results", { timeout: 15_000 });

    // Go back home
    await page.getByRole("button", { name: /go back/i }).click();
    await page.waitForURL("/");

    // Navigate to history
    const historyButton = page.getByRole("button", {
      name: /search history/i,
    });
    await expect(historyButton).toBeVisible({ timeout: 5_000 });
    await historyButton.click();
    await page.waitForURL("**/history");

    // Verify entry exists
    await expect(page.getByText("Test Quarter")).toBeVisible();

    // Click Clear History, then confirm
    await page.getByTestId("clear-history-button").click();
    await expect(page.getByText("Clear all history?")).toBeVisible();
    await page.getByRole("button", { name: /confirm/i }).click();

    // Verify empty state appears
    await expect(page.getByText("No Search History")).toBeVisible();
  });
});
