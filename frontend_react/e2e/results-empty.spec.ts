import { test, expect } from "@playwright/test";

test.describe("Results Page — edge cases", () => {
  test("redirects to home when navigating directly to /results without state", async ({
    page,
  }) => {
    // Navigate directly to /results with no location state
    await page.goto("/results");

    // The app should redirect to the home page
    await page.waitForURL("**/", { timeout: 10_000 });

    // Verify we landed on the home page
    await expect(
      page.getByRole("heading", { name: "CoinScope" }),
    ).toBeVisible();
  });

  test("shows error state when API returns an error", async ({ page }) => {
    // Intercept the identify API call and return a 500 error
    await page.route("**/api/v1/coins/identify", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Internal server error" }),
      }),
    );

    await page.goto("/");

    // Upload an image to trigger the API call
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(
      "/Users/davidtian/src/coinscope/testdata/coin1.jpg",
    );

    // Verify the error banner appears
    const errorBanner = page.getByText(/internal server error/i);
    await expect(errorBanner).toBeVisible({ timeout: 10_000 });

    // Verify we are still on the home page (did not navigate to results)
    await expect(
      page.getByRole("heading", { name: "CoinScope" }),
    ).toBeVisible();
  });
});
