import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewReportPage from "../../src/app/reports/new/page";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({}),
  usePathname: () => "/",
  redirect: vi.fn(),
}));

vi.mock("../../src/lib/api-client", () => ({
  createReport: vi.fn(),
  uploadDataFile: vi.fn(),
  uploadPriorDocument: vi.fn(),
  startGeneration: vi.fn(),
}));

import {
  createReport,
  uploadDataFile,
  uploadPriorDocument,
  startGeneration,
} from "../../src/lib/api-client";

const mockCreateReport = vi.mocked(createReport);
const mockUploadDataFile = vi.mocked(uploadDataFile);
const mockUploadPriorDocument = vi.mocked(uploadPriorDocument);
const mockStartGeneration = vi.mocked(startGeneration);

describe("NewReportPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows step 1 initially with type selector and inputs", () => {
    render(<NewReportPage />);
    expect(screen.getByText("Report Type")).toBeDefined();
    expect(screen.getByText("Report Title")).toBeDefined();
    expect(screen.getByText("Fiscal Year")).toBeDefined();
    expect(screen.getByText("Budget Book")).toBeDefined();
    expect(screen.getByText("Popular Annual Financial Report")).toBeDefined();
  });

  it("has Budget Book selected by default", () => {
    const { container } = render(<NewReportPage />);
    const selectedButton = container.querySelector(".border-blue-500");
    expect(selectedButton).not.toBeNull();
    expect(selectedButton?.textContent).toContain("Budget Book");
  });

  it("disables Next when title is empty", () => {
    render(<NewReportPage />);
    const nextButton = screen.getByText("Next: Upload Data");
    expect((nextButton as HTMLButtonElement).disabled).toBe(true);
  });

  it("enables Next when title is filled", () => {
    render(<NewReportPage />);
    const titleInput = screen.getByPlaceholderText(/FY\d+ Budget Book/);
    fireEvent.change(titleInput, { target: { value: "My Report" } });
    const nextButton = screen.getByText("Next: Upload Data");
    expect((nextButton as HTMLButtonElement).disabled).toBe(false);
  });

  it("advances to step 2 showing FileDropZone for data", () => {
    render(<NewReportPage />);
    const titleInput = screen.getByPlaceholderText(/FY\d+ Budget Book/);
    fireEvent.change(titleInput, { target: { value: "My Report" } });
    fireEvent.click(screen.getByText("Next: Upload Data"));
    expect(screen.getByText("Upload Data File")).toBeDefined();
    expect(
      screen.getByText(/Drop your budget or financial data file here/)
    ).toBeDefined();
  });

  it("shows filename and Change button after file selection in step 2", () => {
    render(<NewReportPage />);
    // Go to step 2
    const titleInput = screen.getByPlaceholderText(/FY\d+ Budget Book/);
    fireEvent.change(titleInput, { target: { value: "My Report" } });
    fireEvent.click(screen.getByText("Next: Upload Data"));

    // Select a file
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["data"], "budget.csv", { type: "text/csv" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText("budget.csv")).toBeDefined();
    expect(screen.getByText("Change")).toBeDefined();
  });

  it("creates report and uploads data on step 2 → step 3", async () => {
    mockCreateReport.mockResolvedValue({
      id: "new-doc",
      tenantId: "t",
      docType: "budget_book",
      title: "My Report",
      fiscalYear: 2026,
      dataSource: "upload",
      worksheetId: null,
      versionId: null,
      uploadedDataS3Key: null,
      priorYearPdfS3Key: null,
      status: "draft",
      styleAnalysis: null,
      generatedPdfS3Key: null,
      webPreviewData: null,
      currentIteration: 0,
      maxIterations: 5,
      createdBy: "user",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    });
    mockUploadDataFile.mockResolvedValue({ s3Key: "data-key" });

    render(<NewReportPage />);
    const titleInput = screen.getByPlaceholderText(/FY\d+ Budget Book/);
    fireEvent.change(titleInput, { target: { value: "My Report" } });
    fireEvent.click(screen.getByText("Next: Upload Data"));

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["data"], "budget.csv", { type: "text/csv" });
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByText("Next: Prior Year Document"));

    await waitFor(() => {
      expect(mockCreateReport).toHaveBeenCalled();
      expect(mockUploadDataFile).toHaveBeenCalledWith("new-doc", file);
    });

    // Should now be on step 3
    await waitFor(() => {
      expect(screen.getByText("Upload Prior Year Document (Optional)")).toBeDefined();
    });
  });

  it("step 3 shows FileDropZone for PDF", async () => {
    mockCreateReport.mockResolvedValue({
      id: "new-doc",
      tenantId: "t", docType: "budget_book", title: "T", fiscalYear: 2026,
      dataSource: "upload", worksheetId: null, versionId: null,
      uploadedDataS3Key: null, priorYearPdfS3Key: null, status: "draft",
      styleAnalysis: null, generatedPdfS3Key: null, webPreviewData: null,
      currentIteration: 0, maxIterations: 5, createdBy: "u",
      createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
    });
    mockUploadDataFile.mockResolvedValue({ s3Key: "k" });

    render(<NewReportPage />);
    fireEvent.change(screen.getByPlaceholderText(/FY\d+ Budget Book/), { target: { value: "T" } });
    fireEvent.click(screen.getByText("Next: Upload Data"));
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["d"], "b.csv", { type: "text/csv" })] } });
    fireEvent.click(screen.getByText("Next: Prior Year Document"));

    await waitFor(() => {
      expect(screen.getByText(/Drop your prior year PDF here/)).toBeDefined();
    });
  });

  it("skip advances to confirm without upload", async () => {
    mockCreateReport.mockResolvedValue({
      id: "new-doc",
      tenantId: "t", docType: "budget_book", title: "T", fiscalYear: 2026,
      dataSource: "upload", worksheetId: null, versionId: null,
      uploadedDataS3Key: null, priorYearPdfS3Key: null, status: "draft",
      styleAnalysis: null, generatedPdfS3Key: null, webPreviewData: null,
      currentIteration: 0, maxIterations: 5, createdBy: "u",
      createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
    });
    mockUploadDataFile.mockResolvedValue({ s3Key: "k" });

    render(<NewReportPage />);
    fireEvent.change(screen.getByPlaceholderText(/FY\d+ Budget Book/), { target: { value: "T" } });
    fireEvent.click(screen.getByText("Next: Upload Data"));
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["d"], "b.csv", { type: "text/csv" })] } });
    fireEvent.click(screen.getByText("Next: Prior Year Document"));

    await waitFor(() => screen.getByText("Skip"));
    fireEvent.click(screen.getByText("Skip"));

    await waitFor(() => {
      expect(screen.getByText("Review & Start")).toBeDefined();
      expect(screen.getByText("Skipped")).toBeDefined();
    });
  });

  it("step 4 shows review summary", async () => {
    mockCreateReport.mockResolvedValue({
      id: "new-doc",
      tenantId: "t", docType: "budget_book", title: "Bristol FY2026", fiscalYear: 2026,
      dataSource: "upload", worksheetId: null, versionId: null,
      uploadedDataS3Key: null, priorYearPdfS3Key: null, status: "draft",
      styleAnalysis: null, generatedPdfS3Key: null, webPreviewData: null,
      currentIteration: 0, maxIterations: 5, createdBy: "u",
      createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
    });
    mockUploadDataFile.mockResolvedValue({ s3Key: "k" });

    render(<NewReportPage />);
    fireEvent.change(screen.getByPlaceholderText(/FY\d+ Budget Book/), { target: { value: "Bristol FY2026" } });
    fireEvent.click(screen.getByText("Next: Upload Data"));
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["d"], "data.csv", { type: "text/csv" })] } });
    fireEvent.click(screen.getByText("Next: Prior Year Document"));
    await waitFor(() => screen.getByText("Skip"));
    fireEvent.click(screen.getByText("Skip"));

    await waitFor(() => {
      expect(screen.getByText("Bristol FY2026")).toBeDefined();
      expect(screen.getByText("data.csv")).toBeDefined();
      expect(screen.getByText("Start First Scan")).toBeDefined();
    });
  });

  it("Start First Scan calls startGeneration and navigates", async () => {
    mockCreateReport.mockResolvedValue({
      id: "new-doc",
      tenantId: "t", docType: "budget_book", title: "T", fiscalYear: 2026,
      dataSource: "upload", worksheetId: null, versionId: null,
      uploadedDataS3Key: null, priorYearPdfS3Key: null, status: "draft",
      styleAnalysis: null, generatedPdfS3Key: null, webPreviewData: null,
      currentIteration: 0, maxIterations: 5, createdBy: "u",
      createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
    });
    mockUploadDataFile.mockResolvedValue({ s3Key: "k" });
    mockStartGeneration.mockResolvedValue({ message: "started", documentId: "new-doc" });

    render(<NewReportPage />);
    fireEvent.change(screen.getByPlaceholderText(/FY\d+ Budget Book/), { target: { value: "T" } });
    fireEvent.click(screen.getByText("Next: Upload Data"));
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["d"], "b.csv", { type: "text/csv" })] } });
    fireEvent.click(screen.getByText("Next: Prior Year Document"));
    await waitFor(() => screen.getByText("Skip"));
    fireEvent.click(screen.getByText("Skip"));
    await waitFor(() => screen.getByText("Start First Scan"));
    fireEvent.click(screen.getByText("Start First Scan"));

    await waitFor(() => {
      expect(mockStartGeneration).toHaveBeenCalledWith("new-doc");
      expect(mockPush).toHaveBeenCalledWith("/reports/new-doc");
    });
  });

  it("shows error banner on API failure", async () => {
    mockCreateReport.mockRejectedValue(new Error("Server error"));

    render(<NewReportPage />);
    fireEvent.change(screen.getByPlaceholderText(/FY\d+ Budget Book/), { target: { value: "T" } });
    fireEvent.click(screen.getByText("Next: Upload Data"));
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["d"], "b.csv", { type: "text/csv" })] } });
    fireEvent.click(screen.getByText("Next: Prior Year Document"));

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeDefined();
    });
  });

  it("back button returns to previous step", () => {
    render(<NewReportPage />);
    fireEvent.change(screen.getByPlaceholderText(/FY\d+ Budget Book/), { target: { value: "T" } });
    fireEvent.click(screen.getByText("Next: Upload Data"));
    expect(screen.getByText("Upload Data File")).toBeDefined();
    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByText("Report Type")).toBeDefined();
  });
});
