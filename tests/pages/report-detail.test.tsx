import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReportDetailPage from "../../src/app/reports/[id]/page";
import { makeDocument } from "../fixtures/factories";

vi.mock("../../src/lib/api-client", () => ({
  getReport: vi.fn(),
  getProgress: vi.fn(),
  getPreview: vi.fn(),
  getReviews: vi.fn(),
  getPdfUrl: vi.fn((id: string) => `http://localhost:4000/api/documents/${id}/pdf`),
  startGeneration: vi.fn(),
}));

vi.mock("../../src/lib/use-poll", () => ({
  usePoll: vi.fn(() => ({ data: null, loading: false, refresh: vi.fn() })),
}));

vi.mock("next/navigation", async () => {
  return {
    useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
    useParams: vi.fn(() => ({ id: "doc-1" })),
    usePathname: () => "/",
    redirect: vi.fn(),
  };
});

// Mock sub-components to simplify testing
vi.mock("../../src/components/TodoList", () => ({
  TodoList: (props: Record<string, unknown>) => (
    <div data-testid="todo-list">{props.documentId as string}</div>
  ),
}));

import { getReport, getPreview, getReviews, startGeneration } from "../../src/lib/api-client";
import { usePoll } from "../../src/lib/use-poll";

const mockGetReport = vi.mocked(getReport);
const mockGetPreview = vi.mocked(getPreview);
const mockGetReviews = vi.mocked(getReviews);
const mockStartGeneration = vi.mocked(startGeneration);
const mockUsePoll = vi.mocked(usePoll);

// Helper: find a tab button by its text (tabs are <button> inside <nav>)
function getTabButton(name: string): HTMLButtonElement {
  const nav = document.querySelector("nav");
  const buttons = nav?.querySelectorAll("button") ?? [];
  for (const btn of buttons) {
    if (btn.textContent === name) return btn;
  }
  throw new Error(`Tab button "${name}" not found`);
}

describe("ReportDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePoll.mockReturnValue({ data: null, loading: false, refresh: vi.fn() });
    mockGetReviews.mockResolvedValue({ documentId: "doc-1", reviews: [] });
    mockGetPreview.mockResolvedValue({ document: makeDocument(), sections: [] });
  });

  it("shows loading state", () => {
    mockGetReport.mockReturnValue(new Promise(() => {}));
    render(<ReportDetailPage />);
    expect(screen.getByText("Loading report...")).toBeDefined();
  });

  it("renders title, badges, and fiscal year", async () => {
    mockGetReport.mockResolvedValue(
      makeDocument({ title: "FY2026 Budget", docType: "budget_book", status: "completed", fiscalYear: 2026 })
    );
    render(<ReportDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("FY2026 Budget")).toBeDefined();
      expect(screen.getByText("Budget Book")).toBeDefined();
      expect(screen.getByText("Completed")).toBeDefined();
      expect(screen.getByText("FY2026")).toBeDefined();
    });
  });

  it("renders stepper with correct step", async () => {
    mockGetReport.mockResolvedValue(makeDocument({ status: "completed_with_todos" }));
    render(<ReportDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Upload")).toBeDefined();
      expect(screen.getByText("Scanning")).toBeDefined();
      // "Todos" appears in both stepper and tab, just check it exists
      expect(screen.getAllByText("Todos").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders tab bar with 5 tabs", async () => {
    mockGetReport.mockResolvedValue(makeDocument({ status: "generating" }));
    render(<ReportDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Progress")).toBeDefined();
      // These appear in both stepper and tab bar
      expect(screen.getAllByText("Todos").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Preview").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Review").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Download").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("disables Download tab unless completed", async () => {
    mockGetReport.mockResolvedValue(makeDocument({ status: "generating" }));
    render(<ReportDetailPage />);
    await waitFor(() => {
      const downloadTab = getTabButton("Download");
      expect(downloadTab.disabled).toBe(true);
    });
  });

  it("shows 'Generation failed' and Retry for failed status", async () => {
    mockGetReport.mockResolvedValue(makeDocument({ status: "failed" }));
    render(<ReportDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Generation failed")).toBeDefined();
      expect(screen.getByText("Retry")).toBeDefined();
    });
  });

  it("calls startGeneration on Retry click", async () => {
    mockGetReport.mockResolvedValue(makeDocument({ status: "failed" }));
    mockStartGeneration.mockResolvedValue({ message: "started", documentId: "doc-1" });
    render(<ReportDetailPage />);
    await waitFor(() => screen.getByText("Retry"));
    fireEvent.click(screen.getByText("Retry"));
    await waitFor(() => {
      expect(mockStartGeneration).toHaveBeenCalledWith("doc-1");
    });
  });

  it("renders TodoList in Todos tab", async () => {
    mockGetReport.mockResolvedValue(makeDocument({ status: "completed_with_todos" }));
    render(<ReportDetailPage />);
    await waitFor(() => {
      expect(screen.getByTestId("todo-list")).toBeDefined();
    });
  });

  it("shows 'No sections' in Preview tab when empty", async () => {
    mockGetReport.mockResolvedValue(makeDocument({ status: "completed" }));
    mockGetPreview.mockResolvedValue({ document: makeDocument(), sections: [] });
    render(<ReportDetailPage />);
    await waitFor(() => getTabButton("Preview"));
    fireEvent.click(getTabButton("Preview"));
    await waitFor(() => {
      expect(screen.getByText("No sections available yet.")).toBeDefined();
    });
  });

  it("shows 'No reviews' in Review tab when empty", async () => {
    mockGetReport.mockResolvedValue(makeDocument({ status: "completed" }));
    render(<ReportDetailPage />);
    await waitFor(() => getTabButton("Review"));
    fireEvent.click(getTabButton("Review"));
    await waitFor(() => {
      expect(screen.getByText("No reviews available yet.")).toBeDefined();
    });
  });

  it("renders download tab with heading and PDF link", async () => {
    mockGetReport.mockResolvedValue(
      makeDocument({ status: "completed", currentIteration: 2, maxIterations: 5 })
    );
    mockGetReviews.mockResolvedValue({ documentId: "doc-1", reviews: [] });
    render(<ReportDetailPage />);
    await waitFor(() => getTabButton("Download"));
    fireEvent.click(getTabButton("Download"));
    await waitFor(() => {
      expect(screen.getByText("Report Complete")).toBeDefined();
      expect(screen.getByText("Completed in 3 of 5 scans")).toBeDefined();
      const pdfLink = screen.getByText("Download PDF");
      expect(pdfLink.closest("a")?.getAttribute("href")).toBe(
        "http://localhost:4000/api/documents/doc-1/pdf"
      );
    });
  });

  it("auto-advances to todos tab for completed_with_todos", async () => {
    mockGetReport.mockResolvedValue(makeDocument({ status: "completed_with_todos" }));
    render(<ReportDetailPage />);
    await waitFor(() => {
      expect(screen.getByTestId("todo-list")).toBeDefined();
    });
  });

  it("auto-advances to download tab for completed", async () => {
    mockGetReport.mockResolvedValue(makeDocument({ status: "completed", currentIteration: 1, maxIterations: 5 }));
    mockGetReviews.mockResolvedValue({ documentId: "doc-1", reviews: [] });
    render(<ReportDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Report Complete")).toBeDefined();
    });
  });

  it("renders criteria reviews in review tab", async () => {
    mockGetReport.mockResolvedValue(makeDocument({ status: "completed" }));
    mockGetReviews.mockResolvedValue({
      documentId: "doc-1",
      reviews: [
        {
          id: "r1",
          documentId: "doc-1",
          tenantId: "t",
          reviewerType: "BB_Reviewer",
          iteration: 0,
          overallScore: "145.50",
          passed: true,
          report: { criteriaName: "GFOA Award", maxScore: 180, scores: [] },
          recommendations: null,
          createdAt: "2026-01-01T00:00:00Z",
        },
      ],
    });
    render(<ReportDetailPage />);
    await waitFor(() => getTabButton("Review"));
    fireEvent.click(getTabButton("Review"));
    await waitFor(() => {
      expect(screen.getByText("GFOA Award")).toBeDefined();
    });
  });

  it("renders WCAG review in review tab", async () => {
    mockGetReport.mockResolvedValue(makeDocument({ status: "completed" }));
    mockGetReviews.mockResolvedValue({
      documentId: "doc-1",
      reviews: [
        {
          id: "r2",
          documentId: "doc-1",
          tenantId: "t",
          reviewerType: "ADA_Reviewer",
          iteration: 0,
          overallScore: null,
          passed: true,
          report: { pdfIssues: [], webIssues: [], passed: true },
          recommendations: null,
          createdAt: "2026-01-01T00:00:00Z",
        },
      ],
    });
    render(<ReportDetailPage />);
    await waitFor(() => getTabButton("Review"));
    fireEvent.click(getTabButton("Review"));
    await waitFor(() => {
      expect(screen.getByText("WCAG 2.1 AA Compliance")).toBeDefined();
    });
  });

  it("renders download tab with final scores", async () => {
    mockGetReport.mockResolvedValue(
      makeDocument({ status: "completed", currentIteration: 2, maxIterations: 5 })
    );
    mockGetReviews.mockResolvedValue({
      documentId: "doc-1",
      reviews: [
        {
          id: "r1",
          documentId: "doc-1",
          tenantId: "t",
          reviewerType: "BB_Reviewer",
          iteration: 2,
          overallScore: "150",
          passed: true,
          report: { criteriaName: "GFOA", maxScore: 180, scores: [] },
          recommendations: null,
          createdAt: "2026-01-01T00:00:00Z",
        },
      ],
    });
    render(<ReportDetailPage />);
    await waitFor(() => getTabButton("Download"));
    fireEvent.click(getTabButton("Download"));
    await waitFor(() => {
      expect(screen.getByText(/Criteria Met/)).toBeDefined();
    });
  });

  it("shows scanning message in preview when actively scanning", async () => {
    mockGetReport.mockResolvedValue(makeDocument({ status: "generating" }));
    mockGetPreview.mockResolvedValue({ document: makeDocument(), sections: [] });
    render(<ReportDetailPage />);
    await waitFor(() => getTabButton("Preview"));
    fireEvent.click(getTabButton("Preview"));
    await waitFor(() => {
      expect(screen.getByText("Sections will appear here as they are generated...")).toBeDefined();
    });
  });
});
