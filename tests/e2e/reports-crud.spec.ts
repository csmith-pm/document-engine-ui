import { test, expect } from "@playwright/test";
import {
  createTestDocument,
  deleteTestDocument,
  cleanupTestDocuments,
} from "./helpers/api-helpers";

test.beforeAll(async () => {
  await cleanupTestDocuments();
});

test.afterAll(async () => {
  await cleanupTestDocuments();
});

test.describe("Reports CRUD", () => {
  test("created report appears in list", async ({ page }) => {
    const doc = await createTestDocument({ title: "CRUD Test Report" });

    await page.goto("/reports");
    // Set tenant
    await page.locator("#tenant-input").fill("e2e-test");

    await page.reload();
    await expect(page.getByText("CRUD Test Report")).toBeVisible();

    // Cleanup
    await deleteTestDocument(doc.id);
  });

  test("report row shows title, type badge, status, and year", async ({ page }) => {
    const doc = await createTestDocument({
      title: "Badge Test",
      docType: "budget_book",
      fiscalYear: 2026,
    });

    await page.goto("/reports");
    await page.locator("#tenant-input").fill("e2e-test");
    await page.reload();

    await expect(page.getByText("Badge Test")).toBeVisible();
    await expect(page.getByText("Budget Book")).toBeVisible();
    await expect(page.getByText("FY2026")).toBeVisible();
    await expect(page.getByText("Draft")).toBeVisible();

    await deleteTestDocument(doc.id);
  });

  test("clicking title navigates to detail page", async ({ page }) => {
    const doc = await createTestDocument({ title: "Nav Test" });

    await page.goto("/reports");
    await page.locator("#tenant-input").fill("e2e-test");
    await page.reload();

    await page.getByText("Nav Test").click();
    await expect(page).toHaveURL(new RegExp(`/reports/${doc.id}`));
    await expect(page.getByText("Nav Test")).toBeVisible();

    await deleteTestDocument(doc.id);
  });

  test("delete with confirmation removes report from list", async ({ page }) => {
    const doc = await createTestDocument({ title: "Delete Me" });

    await page.goto("/reports");
    await page.locator("#tenant-input").fill("e2e-test");
    await page.reload();

    await expect(page.getByText("Delete Me")).toBeVisible();

    // Accept the confirm dialog
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByText("Delete").click();

    await expect(page.getByText("Delete Me")).not.toBeVisible();
  });

  test("empty state after last report deleted", async ({ page }) => {
    await cleanupTestDocuments();

    await page.goto("/reports");
    await page.locator("#tenant-input").fill("e2e-test");
    await page.reload();

    await expect(page.getByText("No reports yet")).toBeVisible();
    await expect(page.getByText("Create your first report")).toBeVisible();
  });
});
