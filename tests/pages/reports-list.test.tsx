import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReportsListPage from "../../src/app/reports/page";
import { makeDocument } from "../fixtures/factories";

vi.mock("../../src/lib/api-client", () => ({
  listReports: vi.fn(),
  deleteReport: vi.fn(),
}));

import { listReports, deleteReport } from "../../src/lib/api-client";

const mockListReports = vi.mocked(listReports);
const mockDeleteReport = vi.mocked(deleteReport);

describe("ReportsListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state", () => {
    mockListReports.mockReturnValue(new Promise(() => {}));
    render(<ReportsListPage />);
    expect(screen.getByText("Loading...")).toBeDefined();
  });

  it("shows empty state with create link", async () => {
    mockListReports.mockResolvedValue([]);
    render(<ReportsListPage />);
    await waitFor(() => {
      expect(screen.getByText("No reports yet")).toBeDefined();
    });
    expect(screen.getByText("Create your first report")).toBeDefined();
  });

  it("renders table headers", async () => {
    mockListReports.mockResolvedValue([makeDocument()]);
    render(<ReportsListPage />);
    await waitFor(() => {
      expect(screen.getByText("Title")).toBeDefined();
      expect(screen.getByText("Type")).toBeDefined();
      expect(screen.getByText("Year")).toBeDefined();
      expect(screen.getByText("Status")).toBeDefined();
      expect(screen.getByText("Scan")).toBeDefined();
      expect(screen.getByText("Created")).toBeDefined();
    });
  });

  it("renders report rows with link", async () => {
    mockListReports.mockResolvedValue([makeDocument({ id: "doc-1", title: "FY2026 Budget Book" })]);
    render(<ReportsListPage />);
    await waitFor(() => {
      const link = screen.getByText("FY2026 Budget Book");
      expect(link.closest("a")?.getAttribute("href")).toBe("/reports/doc-1");
    });
  });

  it("shows DocTypeBadge and StatusBadge", async () => {
    mockListReports.mockResolvedValue([
      makeDocument({ docType: "budget_book", status: "completed" }),
    ]);
    render(<ReportsListPage />);
    await waitFor(() => {
      expect(screen.getByText("Budget Book")).toBeDefined();
      expect(screen.getByText("Completed")).toBeDefined();
    });
  });

  it("shows scan counter", async () => {
    mockListReports.mockResolvedValue([
      makeDocument({ currentIteration: 2, maxIterations: 5 }),
    ]);
    render(<ReportsListPage />);
    await waitFor(() => {
      expect(screen.getByText("3/5")).toBeDefined();
    });
  });

  it("shows formatted date", async () => {
    mockListReports.mockResolvedValue([
      makeDocument({ createdAt: "2026-01-15T00:00:00Z" }),
    ]);
    const { container } = render(<ReportsListPage />);
    await waitFor(() => {
      // Date formatting depends on locale; just check there's a date string in the table
      const tds = container.querySelectorAll("td");
      const hasDate = Array.from(tds).some((td) =>
        /2026/.test(td.textContent ?? "")
      );
      expect(hasDate).toBe(true);
    });
  });

  it("deletes report with confirmation", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    mockListReports.mockResolvedValue([
      makeDocument({ id: "doc-1", title: "To Delete" }),
    ]);
    mockDeleteReport.mockResolvedValue(undefined);
    render(<ReportsListPage />);
    await waitFor(() => screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
      expect(mockDeleteReport).toHaveBeenCalledWith("doc-1");
    });
    // Report should be removed from the list
    await waitFor(() => {
      expect(screen.queryByText("To Delete")).toBeNull();
    });
    confirmSpy.mockRestore();
  });

  it("does not delete when confirm is cancelled", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    mockListReports.mockResolvedValue([
      makeDocument({ id: "doc-1", title: "Keep Me" }),
    ]);
    render(<ReportsListPage />);
    await waitFor(() => screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Delete"));
    expect(mockDeleteReport).not.toHaveBeenCalled();
    expect(screen.getByText("Keep Me")).toBeDefined();
    confirmSpy.mockRestore();
  });

  it("has New Report link to /reports/new", async () => {
    mockListReports.mockResolvedValue([]);
    render(<ReportsListPage />);
    await waitFor(() => {
      const newReportLink = screen.getByText("New Report");
      expect(newReportLink.closest("a")?.getAttribute("href")).toBe("/reports/new");
    });
  });

  it("renders fiscal year with FY prefix", async () => {
    mockListReports.mockResolvedValue([makeDocument({ fiscalYear: 2026 })]);
    render(<ReportsListPage />);
    await waitFor(() => {
      expect(screen.getByText("FY2026")).toBeDefined();
    });
  });
});
