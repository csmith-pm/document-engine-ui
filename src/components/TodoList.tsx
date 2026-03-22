"use client";

import { useState, useCallback, useEffect } from "react";
import { listTodos, updateTodoStatus, continueGeneration } from "@/lib/api-client";
import { TodoChat } from "./TodoChat";
import type { DocumentTodo } from "@/lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  data_gap: "Data Gaps",
  clarification: "Clarifications",
  quality: "Quality Improvements",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-gray-100 text-gray-600",
};

const STATUS_ICONS: Record<string, string> = {
  open: "border-2 border-gray-300",
  in_progress: "border-2 border-blue-400 bg-blue-50",
  resolved: "bg-green-500",
  skipped: "bg-gray-300",
};

export function TodoList({
  documentId,
  currentIteration,
  maxIterations,
  onContinue,
  onGeneratePdf,
}: {
  documentId: string;
  currentIteration: number;
  maxIterations: number;
  onContinue: () => void;
  onGeneratePdf: () => void;
}) {
  const [todos, setTodos] = useState<DocumentTodo[]>([]);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadTodos = useCallback(async () => {
    try {
      const result = await listTodos(documentId);
      setTodos(result.todos);
    } catch (err) {
      console.error("Failed to load todos:", err);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    void loadTodos();
  }, [loadTodos]);

  const handleStatusChange = useCallback(
    async (todoId: string, status: "resolved" | "skipped" | "open") => {
      try {
        await updateTodoStatus(todoId, status);
        await loadTodos();
      } catch (err) {
        console.error("Failed to update status:", err);
      }
    },
    [loadTodos]
  );

  const handleContinue = useCallback(async () => {
    setActionLoading("continue");
    try {
      await continueGeneration(documentId);
      onContinue();
    } catch (err) {
      console.error("Failed to continue:", err);
      setActionLoading(null);
    }
  }, [documentId, onContinue]);

  const handleGeneratePdf = useCallback(async () => {
    setActionLoading("pdf");
    try {
      // Generate PDF uses the same regenerate endpoint but signals final
      await continueGeneration(documentId);
      onGeneratePdf();
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      setActionLoading(null);
    }
  }, [documentId, onGeneratePdf]);

  if (loading) {
    return <p className="text-gray-500">Loading action items...</p>;
  }

  if (todos.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <p className="text-green-800 font-medium">No action items</p>
          <p className="text-green-600 text-sm mt-1">
            The report generation had all the data it needed.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleGeneratePdf}
            disabled={actionLoading !== null}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            {actionLoading === "pdf" ? "Starting..." : "Generate PDF"}
          </button>
        </div>
      </div>
    );
  }

  // Group by category
  const grouped = todos.reduce<Record<string, DocumentTodo[]>>((acc, todo) => {
    const cat = todo.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(todo);
    return acc;
  }, {});

  const resolvedCount = todos.filter(
    (t) => t.status === "resolved" || t.status === "skipped"
  ).length;

  const canContinueIterating = currentIteration + 1 < maxIterations;

  return (
    <div className="flex gap-6">
      {/* Left: Checklist */}
      <div className="flex-1 min-w-0">
        {/* Summary bar */}
        <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg text-sm">
          <span className="text-gray-600">
            {resolvedCount} of {todos.length} resolved
          </span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{
                width: `${todos.length > 0 ? (resolvedCount / todos.length) * 100 : 0}%`,
              }}
            />
          </div>
          <span className="text-gray-500 text-xs">
            Scan {currentIteration + 1} of {maxIterations}
          </span>
        </div>

        {/* Grouped todos */}
        {["data_gap", "clarification", "quality"].map((category) => {
          const items = grouped[category];
          if (!items || items.length === 0) return null;

          return (
            <div key={category} className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {CATEGORY_LABELS[category] ?? category}{" "}
                <span className="text-gray-400">({items.length})</span>
              </h3>
              <div className="space-y-2">
                {items.map((todo) => (
                  <div
                    key={todo.id}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setSelectedTodoId(
                        selectedTodoId === todo.id ? null : todo.id
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedTodoId(
                          selectedTodoId === todo.id ? null : todo.id
                        );
                      }
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedTodoId === todo.id
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 ${STATUS_ICONS[todo.status]}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            todo.status === "open" ||
                            todo.status === "in_progress"
                          ) {
                            void handleStatusChange(todo.id, "resolved");
                          } else if (todo.status === "resolved") {
                            void handleStatusChange(todo.id, "open");
                          }
                        }}
                      >
                        {todo.status === "resolved" && (
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-sm font-medium ${
                              todo.status === "resolved" ||
                              todo.status === "skipped"
                                ? "line-through text-gray-400"
                                : "text-gray-900"
                            }`}
                          >
                            {todo.title}
                          </span>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[todo.priority]}`}
                          >
                            {todo.priority}
                          </span>
                        </div>
                        {todo.sectionType && (
                          <span className="text-xs text-gray-400">
                            {todo.sectionType.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>

                      {(todo.status === "open" ||
                        todo.status === "in_progress") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleStatusChange(todo.id, "skipped");
                          }}
                          className="text-xs text-gray-400 hover:text-gray-600"
                          title="Skip this item"
                        >
                          Skip
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          {canContinueIterating && (
            <button
              onClick={handleContinue}
              disabled={actionLoading !== null}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {actionLoading === "continue"
                ? "Starting next scan..."
                : "Continue Iterating"}
            </button>
          )}
          <button
            onClick={handleGeneratePdf}
            disabled={actionLoading !== null}
            className={`flex-1 px-4 py-3 rounded-lg font-medium disabled:opacity-50 ${
              canContinueIterating
                ? "bg-white border-2 border-green-600 text-green-700 hover:bg-green-50"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {actionLoading === "pdf" ? "Starting..." : "Generate PDF"}
          </button>
        </div>
        {!canContinueIterating && (
          <p className="text-xs text-gray-500 text-center mt-2">
            Maximum iterations reached. Generate your final PDF.
          </p>
        )}
      </div>

      {/* Right: Chat panel */}
      {selectedTodoId && (
        <div className="w-96 flex-shrink-0">
          <TodoChat
            todoId={selectedTodoId}
            onStatusChange={(status) =>
              handleStatusChange(selectedTodoId, status)
            }
          />
        </div>
      )}
    </div>
  );
}
