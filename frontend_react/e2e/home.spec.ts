import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("loads with CoinScope title", async ({ page }) => {
    const heading = page.getByRole("heading", { name: "CoinScope" });
    await expect(heading).toBeVisible();
  });

  test("shows Take Photo button", async ({ page }) => {
    const takePhotoButton = page.getByRole("button", { name: /take photo/i });
    await expect(takePhotoButton).toBeVisible();
  });

  test("shows Choose from Gallery button", async ({ page }) => {
    const galleryButton = page.getByRole("button", {
      name: /choose from gallery/i,
    });
    await expect(galleryButton).toBeVisible();
  });

  test("shows the instructions card", async ({ page }) => {
    const instructionsHeading = page.getByRole("heading", {
      name: /take a photo of your coins/i,
    });
    await expect(instructionsHeading).toBeVisible();

    const instructionsBody = page.getByText(
      /position coins on a flat surface/i,
    );
    await expect(instructionsBody).toBeVisible();
  });

  test("shows the tagline", async ({ page }) => {
    const tagline = page.getByText("Identify coins instantly with AI");
    await expect(tagline).toBeVisible();
  });
});
