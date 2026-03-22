// ---- Document statuses ----

export type DocumentStatus =
  | "draft"
  | "analyzing"
  | "generating"
  | "reviewing"
  | "revision"
  | "completed"
  | "completed_with_todos"
  | "failed";

export type JobStatus = "pending" | "running" | "completed" | "failed";

export type TodoCategory = "data_gap" | "clarification" | "quality";
export type TodoStatus = "open" | "in_progress" | "resolved" | "skipped";
export type TodoPriority = "high" | "medium" | "low";
export type MessageRole = "agent" | "user";

// ---- Core entities ----

export interface Document {
  id: string;
  tenantId: string;
  docType: string;
  title: string;
  fiscalYear: number;
  dataSource: "module" | "upload";
  worksheetId: string | null;
  versionId: string | null;
  uploadedDataS3Key: string | null;
  priorYearPdfS3Key: string | null;
  status: DocumentStatus;
  styleAnalysis: Record<string, unknown> | null;
  generatedPdfS3Key: string | null;
  webPreviewData: Record<string, unknown> | null;
  currentIteration: number;
  maxIterations: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentSection {
  id: string;
  documentId: string;
  tenantId: string;
  sectionType: string;
  sectionOrder: number;
  title: string;
  narrativeContent: string | null;
  tableData: TableRow[] | null;
  chartConfigs: ChartConfig[] | null;
  chartImageS3Keys: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentReview {
  id: string;
  documentId: string;
  tenantId: string;
  reviewerType: string;
  iteration: number;
  overallScore: string | null;
  passed: boolean;
  report: Record<string, unknown>;
  recommendations: Record<string, unknown>[] | null;
  createdAt: string;
}

export interface DocumentJob {
  id: string;
  documentId: string;
  tenantId: string;
  jobType: string;
  status: JobStatus;
  progress: number;
  message: string | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface DocumentTodo {
  id: string;
  documentId: string;
  tenantId: string;
  category: TodoCategory;
  title: string;
  description: string;
  sectionType: string | null;
  status: TodoStatus;
  priority: TodoPriority;
  sourceReviewId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodoMessage {
  id: string;
  todoId: string;
  role: MessageRole;
  content: string;
  attachmentS3Keys: string[] | null;
  createdAt: string;
}

// ---- Chart / table types used in SectionPreview ----

export interface ChartConfig {
  type: string;
  title: string;
  data: Record<string, unknown>[];
  dataKeys: string[];
  categoryKey: string;
  colors?: string[];
}

export interface TableRow {
  header?: boolean;
  cells: string[];
}

// ---- Review sub-types ----

export interface ReviewCategoryScore {
  category: string;
  maxPoints: number;
  awardedPoints: number;
  feedback: string;
}

export interface CriteriaReviewReport {
  criteriaName: string;
  maxScore: number;
  scores: ReviewCategoryScore[];
}

export interface WcagIssue {
  rule: string;
  severity: string;
  location: string;
  description: string;
  fix: string;
}

export interface WcagReviewReport {
  pdfIssues: WcagIssue[];
  webIssues: WcagIssue[];
  passed: boolean;
}

// ---- API request types ----

export interface CreateReportInput {
  docType: string;
  title: string;
  fiscalYear: number;
  dataSource?: "module" | "upload";
  maxIterations?: number;
}

// ---- Doc type options for the picker ----

export interface DocTypeOption {
  value: string;
  label: string;
  description: string;
}

export const DOC_TYPE_OPTIONS: DocTypeOption[] = [
  {
    value: "budget_book",
    label: "Budget Book",
    description: "GFOA Distinguished Budget Presentation Award criteria",
  },
  {
    value: "pafr",
    label: "Popular Annual Financial Report",
    description: "Excellence in Popular Annual Financial Reporting criteria",
  },
];
