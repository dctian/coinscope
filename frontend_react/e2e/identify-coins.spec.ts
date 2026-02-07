import { test, expect } from "@playwright/test";
import path from "path";

const TEST_IMAGE = path.resolve(
  "/Users/davidtian/src/coinscope/testdata/coin1.jpg",
);

/**
 * Full identification flow tests.
 *
 * REQUIRES: Backend running at http://localhost:8000
 *
 * These tests upload a real image, wait for VLM identification, and verify
 * the results page, coin cards, and detail modal.
 */
test.describe("Identify Coins (requires backend)", () => {
  test("uploads an image and displays results", async ({ page }) => {
    // Go to home page
    await page.goto("/");

    // Upload an image via the hidden file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE);

    // The app should show a loading spinner while processing
    await expect(page.getByText(/analyzing coins/i)).toBeVisible();

    // Wait for navigation to /results (VLM can be slow, use generous timeout)
    await page.waitForURL("**/results", { timeout: 60_000 });

    // Verify at least one coin card is displayed
    const coinCards = page.locator(
      'button:has(h3)',
    );
    await expect(coinCards.first()).toBeVisible({ timeout: 60_000 });
    const cardCount = await coinCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Verify the image preview is shown
    const imagePreview = page.locator('img[alt="Uploaded coin"]');
    await expect(imagePreview).toBeVisible();

    // Verify the "N Coin(s) Found" summary text
    await expect(page.getByText(/\d+ coins? found/i)).toBeVisible();

    // Click on the first coin card to open the detail modal
    await coinCards.first().click();

    // Verify the modal opens with coin details
    const modal = page.locator(".fixed.inset-0.z-50");
    await expect(modal).toBeVisible();

    // Verify modal has coin detail fields
    await expect(page.getByText("Year", { exact: true })).toBeVisible();
    await expect(page.getByText("Denomination", { exact: true })).toBeVisible();
    await expect(page.getByText("Currency", { exact: true })).toBeVisible();
    await expect(page.getByText("Confidence", { exact: true })).toBeVisible();

    // Verify the coin name heading is shown in the modal
    const modalHeading = modal.locator("h2");
    await expect(modalHeading).toBeVisible();

    // Verify the country is shown
    const countryText = modal.locator("h2 + p");
    await expect(countryText).toBeVisible();

    // Close the modal using the Close button
    const closeButton = page.getByRole("button", { name: "Close" });
    await closeButton.click();

    // Verify modal has disappeared
    await expect(modal).not.toBeVisible();

    // Click back button to return to home page
    const backButton = page.getByRole("button", { name: "Go back" });
    await backButton.click();

    // Verify we are back on the home page
    await expect(
      page.getByRole("heading", { name: "CoinScope" }),
    ).toBeVisible();
  });
});
