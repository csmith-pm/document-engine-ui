import type {
  Document,
  DocumentSection,
  DocumentReview,
  DocumentJob,
  DocumentTodo,
  TodoMessage,
  CreateReportInput,
} from "./types";

const API_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
    : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function getTenantId(): string {
  if (typeof window === "undefined") return "default";
  return localStorage.getItem("tenantId") ?? "default";
}

function getUserId(): string {
  if (typeof window === "undefined") return "unknown";
  return localStorage.getItem("userId") ?? "unknown";
}

function headers(extra?: Record<string, string>): Record<string, string> {
  return {
    "x-tenant-id": getTenantId(),
    "x-user-id": getUserId(),
    ...extra,
  };
}

async function request<T>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      ...headers(),
      ...(opts.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ---- Reports (documents) ----

export function createReport(body: CreateReportInput): Promise<Document> {
  return request<Document>("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, dataSource: body.dataSource ?? "upload" }),
  });
}

export function listReports(): Promise<Document[]> {
  return request<Document[]>("/api/documents");
}

export function getReport(id: string): Promise<Document> {
  return request<Document>(`/api/documents/${id}`);
}

export function deleteReport(id: string): Promise<void> {
  return request<void>(`/api/documents/${id}`, { method: "DELETE" });
}

// ---- File uploads (multipart) ----

export async function uploadDataFile(
  id: string,
  file: File
): Promise<{ s3Key: string }> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_URL}/api/documents/${id}/data-file`, {
    method: "POST",
    headers: headers(),
    body: form,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Upload failed ${res.status}: ${body}`);
  }

  return res.json();
}

export async function uploadPriorDocument(
  id: string,
  file: File
): Promise<{ s3Key: string }> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_URL}/api/documents/${id}/prior-document`, {
    method: "POST",
    headers: headers(),
    body: form,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Upload failed ${res.status}: ${body}`);
  }

  return res.json();
}

// ---- Generation ----

export function startGeneration(
  id: string
): Promise<{ message: string; documentId: string }> {
  return request("/api/documents/${id}/generate".replace("${id}", id), {
    method: "POST",
  });
}

export function continueGeneration(
  id: string
): Promise<{ message: string; documentId: string }> {
  return request(`/api/documents/${id}/regenerate`, { method: "POST" });
}

// ---- Progress & Preview (polled) ----

export function getProgress(
  id: string
): Promise<{ documentId: string; jobs: DocumentJob[] }> {
  return request(`/api/documents/${id}/progress`);
}

export function getPreview(
  id: string
): Promise<{ document: Document; sections: DocumentSection[] }> {
  return request(`/api/documents/${id}/preview`);
}

export function getReviews(
  id: string
): Promise<{ documentId: string; reviews: DocumentReview[] }> {
  return request(`/api/documents/${id}/reviews`);
}

export function getPdfUrl(id: string): string {
  return `${API_URL}/api/documents/${id}/pdf`;
}

// ---- Todos ----

export function listTodos(
  documentId: string
): Promise<{ documentId: string; todos: DocumentTodo[] }> {
  return request(`/api/documents/${documentId}/todos`);
}

export function getTodo(
  todoId: string
): Promise<{ todo: DocumentTodo; messages: TodoMessage[] }> {
  return request(`/api/documents/todos/${todoId}`);
}

export function sendMessage(
  todoId: string,
  message: string
): Promise<{ todo: DocumentTodo; messages: TodoMessage[] }> {
  return request(`/api/documents/todos/${todoId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
}

export async function uploadTodoFile(
  todoId: string,
  file: File
): Promise<{ s3Key: string }> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(
    `${API_URL}/api/documents/todos/${todoId}/files`,
    {
      method: "POST",
      headers: headers(),
      body: form,
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Upload failed ${res.status}: ${body}`);
  }

  return res.json();
}

export function updateTodoStatus(
  todoId: string,
  status: string
): Promise<DocumentTodo> {
  return request(`/api/documents/todos/${todoId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}
