import { test, expect } from "@playwright/test";

test.describe("Upload flow interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("clicking Choose from Gallery triggers the file input", async ({
    page,
  }) => {
    const fileInput = page.locator('input[type="file"]');

    // Listen for the file chooser event that fires when the input is clicked
    const fileChooserPromise = page.waitForEvent("filechooser");

    const galleryButton = page.getByRole("button", {
      name: /choose from gallery/i,
    });
    await galleryButton.click();

    const fileChooser = await fileChooserPromise;
    expect(fileChooser).toBeTruthy();

    // Verify the file input accepts image types
    const accept = await fileInput.getAttribute("accept");
    expect(accept).toContain("image/");
  });

  test("shows error when API returns 400 for bad file", async ({ page }) => {
    // Mock the API to return a 400 error (e.g. unsupported file type)
    await page.route("**/api/v1/coins/identify*", (route) =>
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          detail: "Invalid file type. Please upload an image.",
        }),
      }),
    );

    // Upload a file (even though it is a valid image, the mock returns 400)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(
      "/Users/davidtian/src/coinscope/testdata/coin1.jpg",
    );

    // Verify the error message appears
    const errorMessage = page.getByText(
      /invalid file type\. please upload an image/i,
    );
    await expect(errorMessage).toBeVisible({ timeout: 10_000 });
  });

  test("shows loading spinner during upload", async ({ page }) => {
    // Mock the API with a delayed response to observe the loading state
    await page.route("**/api/v1/coins/identify*", async (route) => {
      // Delay the response by 3 seconds
      await new Promise((resolve) => setTimeout(resolve, 3_000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
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
          model_used: "test/model",
        }),
      });
    });

    // Upload an image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(
      "/Users/davidtian/src/coinscope/testdata/coin1.jpg",
    );

    // Verify the loading spinner and text appear
    await expect(page.getByText(/analyzing coins/i)).toBeVisible();
    await expect(
      page.getByText(/this may take a few seconds/i),
    ).toBeVisible();

    // Wait for the results page to appear after the delayed response
    await page.waitForURL("**/results", { timeout: 15_000 });

    // Verify the spinner is gone and results are shown
    await expect(page.getByText(/analyzing coins/i)).not.toBeVisible();
    await expect(page.getByText(/1 coin found/i)).toBeVisible();
  });
});
