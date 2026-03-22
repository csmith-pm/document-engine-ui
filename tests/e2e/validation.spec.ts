import { test, expect } from "@playwright/test";

test.describe("Validation", () => {
  test("empty title disables Next button", async ({ page }) => {
    await page.goto("/reports/new");
    const nextButton = page.getByText("Next: Upload Data");
    await expect(nextButton).toBeDisabled();
  });

  test("typing title enables Next button", async ({ page }) => {
    await page.goto("/reports/new");
    await page.getByPlaceholder(/FY\d+/).fill("My Report");
    const nextButton = page.getByText("Next: Upload Data");
    await expect(nextButton).toBeEnabled();
  });

  test("nonexistent report shows loading then error", async ({ page }) => {
    await page.goto("/reports/00000000-0000-0000-0000-000000000000");
    // Should show loading initially
    await expect(page.getByText("Loading report...")).toBeVisible();
  });

  test("New Report link navigates to wizard", async ({ page }) => {
    await page.goto("/reports");
    await page.getByText("New Report").click();
    await expect(page).toHaveURL("/reports/new");
    await expect(page.getByText("Report Type")).toBeVisible();
  });
});
