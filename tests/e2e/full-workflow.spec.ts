import { test, expect } from "@playwright/test";
import path from "path";
import { cleanupTestDocuments, waitForStatus } from "./helpers/api-helpers";

test.beforeAll(async () => {
  await cleanupTestDocuments();
});

test.afterAll(async () => {
  await cleanupTestDocuments();
});

test.describe("Full Workflow", () => {
  test("create report, upload data, start scan, verify completion", async ({
    page,
  }) => {
    // Set tenant
    await page.goto("/reports");
    await page.locator("#tenant-input").fill("e2e-test");

    // Navigate to new report
    await page.getByText("New Report").click();
    await expect(page).toHaveURL("/reports/new");

    // Step 1: Fill in report details
    await expect(page.getByText("Report Type")).toBeVisible();
    await page.getByText("Budget Book").click();
    await page.getByPlaceholder(/FY\d+/).fill("E2E Bristol FY2026");

    const yearInput = page.locator('input[type="number"]');
    await yearInput.fill("2026");

    await page.getByText("Next: Upload Data").click();

    // Step 2: Upload data file
    await expect(page.getByText("Upload Data File")).toBeVisible();

    const csvPath = path.resolve(
      __dirname,
      "fixtures/bristol-budget-e2e.csv"
    );
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);
    await expect(page.getByText("bristol-budget-e2e.csv")).toBeVisible();

    await page.getByText("Next: Prior Year Document").click();

    // Step 3: Skip prior year
    await expect(
      page.getByText("Upload Prior Year Document (Optional)")
    ).toBeVisible();
    await page.getByText("Skip").click();

    // Step 4: Review and start
    await expect(page.getByText("Review & Start")).toBeVisible();
    await expect(page.getByText("E2E Bristol FY2026")).toBeVisible();
    await expect(page.getByText("bristol-budget-e2e.csv")).toBeVisible();

    await page.getByText("Start First Scan").click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/reports\/.+/);

    // Wait for progress to appear
    await expect(page.getByText(/Overall Progress/)).toBeVisible({
      timeout: 15_000,
    });

    // Extract document ID from URL
    const url = page.url();
    const docId = url.split("/reports/")[1];

    // Wait for scan to complete (up to 2 minutes)
    const finalDoc = await waitForStatus(
      docId,
      ["completed", "completed_with_todos", "failed"],
      120_000
    );

    // Reload to see final state
    await page.reload();

    if (finalDoc.status === "completed") {
      // Should auto-advance to download tab
      await expect(page.getByText("Report Complete")).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByText("Download PDF")).toBeVisible();
    } else if (finalDoc.status === "completed_with_todos") {
      // Should show todos tab
      await expect(page.getByText(/resolved/)).toBeVisible({ timeout: 10_000 });
    }

    // Verify report appears in list
    await page.goto("/reports");
    await page.locator("#tenant-input").fill("e2e-test");
    await page.reload();
    await expect(page.getByText("E2E Bristol FY2026")).toBeVisible();
  });
});
