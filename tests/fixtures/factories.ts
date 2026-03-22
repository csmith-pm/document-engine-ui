import type {
  Document,
  DocumentJob,
  DocumentSection,
  DocumentReview,
  DocumentTodo,
  TodoMessage,
  ChartConfig,
  TableRow,
  WcagReviewReport,
} from "../../src/lib/types";

export function makeDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: "doc-1",
    tenantId: "test-tenant",
    docType: "budget_book",
    title: "FY2026 Budget Book",
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
    createdBy: "test-user",
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-01-15T00:00:00Z",
    ...overrides,
  };
}

export function makeDocumentJob(overrides: Partial<DocumentJob> = {}): DocumentJob {
  return {
    id: "job-1",
    documentId: "doc-1",
    tenantId: "test-tenant",
    jobType: "generate_sections",
    status: "pending",
    progress: 0,
    message: null,
    error: null,
    startedAt: null,
    completedAt: null,
    createdAt: "2026-01-15T00:00:00Z",
    ...overrides,
  };
}

export function makeDocumentSection(overrides: Partial<DocumentSection> = {}): DocumentSection {
  return {
    id: "sec-1",
    documentId: "doc-1",
    tenantId: "test-tenant",
    sectionType: "executive_summary",
    sectionOrder: 1,
    title: "Executive Summary",
    narrativeContent: "This is the executive summary.\n\nIt has multiple paragraphs.",
    tableData: null,
    chartConfigs: null,
    chartImageS3Keys: null,
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-01-15T00:00:00Z",
    ...overrides,
  };
}

export function makeDocumentReview(overrides: Partial<DocumentReview> = {}): DocumentReview {
  return {
    id: "rev-1",
    documentId: "doc-1",
    tenantId: "test-tenant",
    reviewerType: "BB_Reviewer",
    iteration: 0,
    overallScore: "145.50",
    passed: true,
    report: {
      criteriaName: "GFOA Distinguished Budget Award",
      maxScore: 180,
      scores: [
        {
          category: "Financial Policies",
          maxPoints: 40,
          awardedPoints: 35,
          feedback: "Good coverage",
        },
        {
          category: "Revenue Analysis",
          maxPoints: 30,
          awardedPoints: 20,
          feedback: "Needs more detail",
        },
      ],
    },
    recommendations: null,
    createdAt: "2026-01-15T00:00:00Z",
    ...overrides,
  };
}

export function makeDocumentTodo(overrides: Partial<DocumentTodo> = {}): DocumentTodo {
  return {
    id: "todo-1",
    documentId: "doc-1",
    tenantId: "test-tenant",
    category: "data_gap",
    title: "Missing revenue data",
    description: "Revenue projections for FY2027 are missing",
    sectionType: "revenue_summary",
    status: "open",
    priority: "high",
    sourceReviewId: null,
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-01-15T00:00:00Z",
    ...overrides,
  };
}

export function makeTodoMessage(overrides: Partial<TodoMessage> = {}): TodoMessage {
  return {
    id: "msg-1",
    todoId: "todo-1",
    role: "agent",
    content: "I can help you with that.",
    attachmentS3Keys: null,
    createdAt: "2026-01-15T00:00:00Z",
    ...overrides,
  };
}

export function makeChartConfig(type: string = "bar"): ChartConfig {
  return {
    type,
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
    data: [
      { category: "FY2023", revenue: 225000000, expenditure: 220000000 },
      { category: "FY2024", revenue: 233000000, expenditure: 228000000 },
    ],
    dataKeys: ["revenue", "expenditure"],
    categoryKey: "category",
  };
}

export function makeTableRows(): TableRow[] {
  return [
    { header: true, cells: ["Category", "FY2024 Actual", "FY2025 Budget", "FY2026 Proposed"] },
    { cells: ["Taxes & Prior Levies", "$165,036,886", "$174,355,790", "$186,398,750"] },
    { cells: ["Intergovernmental", "$53,816,345", "$42,814,880", "$43,972,390"] },
    { cells: ["Total Revenues", "$233,158,193", "$226,064,780", "$242,658,950"] },
  ];
}

export function makeWcagReport(overrides: Partial<WcagReviewReport> = {}): WcagReviewReport {
  return {
    pdfIssues: [],
    webIssues: [],
    passed: true,
    ...overrides,
  };
}
