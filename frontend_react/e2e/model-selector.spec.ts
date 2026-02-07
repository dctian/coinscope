import { test, expect } from "@playwright/test";

test.describe("Model Selector", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows model selector with 3 options", async ({ page }) => {
    const selector = page.getByRole("radiogroup", {
      name: /select ai model/i,
    });
    await expect(selector).toBeVisible();

    await expect(
      page.getByRole("radio", { name: "Gemini 3 Pro", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("radio", { name: "Gemini Flash", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("radio", { name: "Gemini Flash Lite", exact: true }),
    ).toBeVisible();
  });

  test("has Gemini 3 Pro selected by default", async ({ page }) => {
    const pro = page.getByRole("radio", { name: "Gemini 3 Pro", exact: true });
    await expect(pro).toHaveAttribute("aria-checked", "true");
  });

  test("clicking a different model selects it", async ({ page }) => {
    const flashLite = page.getByRole("radio", { name: "Gemini Flash Lite" });
    await flashLite.click();
    await expect(flashLite).toHaveAttribute("aria-checked", "true");

    const pro = page.getByRole("radio", { name: "Gemini 3 Pro", exact: true });
    await expect(pro).toHaveAttribute("aria-checked", "false");
  });

  test("persists model selection across page reloads", async ({ page }) => {
    // Select Flash Lite
    const flashLite = page.getByRole("radio", { name: "Gemini Flash Lite" });
    await flashLite.click();
    await expect(flashLite).toHaveAttribute("aria-checked", "true");

    // Reload
    await page.reload();

    // Flash Lite should still be selected
    const flashLiteAfter = page.getByRole("radio", {
      name: "Gemini Flash Lite",
    });
    await expect(flashLiteAfter).toHaveAttribute("aria-checked", "true");
  });

  test("sends selected model to the API", async ({ page }) => {
    // Mock the API response so we don't need a real backend
    await page.route("**/api/v1/coins/identify*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          coins: [
            {
              id: "1",
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
          total_coins_detected: 1,
          model_used: "gemini-2.0-flash-lite",
        }),
      });
    });

    // Select Flash Lite
    await page.getByRole("radio", { name: "Gemini Flash Lite" }).click();

    // Set up listener for the API call before uploading
    const apiPromise = page.waitForRequest((req) =>
      req.url().includes("/api/v1/coins/identify"),
    );

    // Upload a minimal test file via the file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test-coin.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
    });

    // Wait for the API request and verify the model parameter
    const apiRequest = await apiPromise;
    const requestUrl = apiRequest.url();
    expect(requestUrl).toContain("model=gemini-2.0-flash-lite");
  });
});
