"use client";

import type { DocumentStatus } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  analyzing: "bg-blue-100 text-blue-700",
  generating: "bg-blue-100 text-blue-700",
  reviewing: "bg-blue-100 text-blue-700",
  revision: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  completed_with_todos: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  analyzing: "Analyzing",
  generating: "Generating",
  reviewing: "Reviewing",
  revision: "Revising",
  completed: "Completed",
  completed_with_todos: "Needs Attention",
  failed: "Failed",
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
