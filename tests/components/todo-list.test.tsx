import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TodoList } from "../../src/components/TodoList";

vi.mock("../../src/lib/api-client", () => ({
  listTodos: vi.fn(),
  updateTodoStatus: vi.fn(),
  continueGeneration: vi.fn(),
}));

// Mock TodoChat to avoid nested API calls
vi.mock("../../src/components/TodoChat", () => ({
  TodoChat: ({ todoId }: { todoId: string }) => (
    <div data-testid="todo-chat">{todoId}</div>
  ),
}));

import { listTodos, updateTodoStatus, continueGeneration } from "../../src/lib/api-client";
import { makeDocumentTodo } from "../fixtures/factories";

const mockListTodos = vi.mocked(listTodos);
const mockUpdateTodoStatus = vi.mocked(updateTodoStatus);
const mockContinueGeneration = vi.mocked(continueGeneration);

const defaultProps = {
  documentId: "doc-1",
  currentIteration: 1,
  maxIterations: 5,
  onContinue: vi.fn(),
  onGeneratePdf: vi.fn(),
};

describe("TodoList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultProps.onContinue = vi.fn();
    defaultProps.onGeneratePdf = vi.fn();
  });

  it("shows loading state", () => {
    mockListTodos.mockReturnValue(new Promise(() => {}));
    render(<TodoList {...defaultProps} />);
    expect(screen.getByText("Loading action items...")).toBeDefined();
  });

  it("shows 'No action items' empty state with Generate PDF button", async () => {
    mockListTodos.mockResolvedValue({ documentId: "doc-1", todos: [] });
    render(<TodoList {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("No action items")).toBeDefined();
    });
    expect(screen.getByText("Generate PDF")).toBeDefined();
  });

  it("groups todos by category", async () => {
    const todos = [
      makeDocumentTodo({ id: "t1", category: "data_gap", title: "Gap 1" }),
      makeDocumentTodo({ id: "t2", category: "clarification", title: "Clarify 1" }),
      makeDocumentTodo({ id: "t3", category: "quality", title: "Quality 1" }),
    ];
    mockListTodos.mockResolvedValue({ documentId: "doc-1", todos });
    render(<TodoList {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("Data Gaps")).toBeDefined();
      expect(screen.getByText("Clarifications")).toBeDefined();
      expect(screen.getByText("Quality Improvements")).toBeDefined();
    });
  });

  it("shows resolution progress bar", async () => {
    const todos = [
      makeDocumentTodo({ id: "t1", status: "resolved" }),
      makeDocumentTodo({ id: "t2", status: "resolved" }),
      makeDocumentTodo({ id: "t3", status: "open" }),
      makeDocumentTodo({ id: "t4", status: "open" }),
      makeDocumentTodo({ id: "t5", status: "open" }),
    ];
    mockListTodos.mockResolvedValue({ documentId: "doc-1", todos });
    render(<TodoList {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("2 of 5 resolved")).toBeDefined();
    });
  });

  it("shows iteration counter", async () => {
    const todos = [makeDocumentTodo()];
    mockListTodos.mockResolvedValue({ documentId: "doc-1", todos });
    render(<TodoList {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("Scan 2 of 5")).toBeDefined();
    });
  });

  it("shows 'Continue Iterating' when iteration < max", async () => {
    const todos = [makeDocumentTodo()];
    mockListTodos.mockResolvedValue({ documentId: "doc-1", todos });
    render(<TodoList {...defaultProps} currentIteration={1} maxIterations={5} />);
    await waitFor(() => {
      expect(screen.getByText("Continue Iterating")).toBeDefined();
    });
  });

  it("hides 'Continue Iterating' at max iterations and shows message", async () => {
    const todos = [makeDocumentTodo()];
    mockListTodos.mockResolvedValue({ documentId: "doc-1", todos });
    render(<TodoList {...defaultProps} currentIteration={4} maxIterations={5} />);
    await waitFor(() => {
      expect(screen.queryByText("Continue Iterating")).toBeNull();
      expect(
        screen.getByText("Maximum iterations reached. Generate your final PDF.")
      ).toBeDefined();
    });
  });

  it("selects and deselects a todo", async () => {
    const todos = [makeDocumentTodo({ id: "t1", title: "Test Todo" })];
    mockListTodos.mockResolvedValue({ documentId: "doc-1", todos });
    render(<TodoList {...defaultProps} />);
    await waitFor(() => screen.getByText("Test Todo"));
    // Click to select
    fireEvent.click(screen.getByText("Test Todo"));
    expect(screen.getByTestId("todo-chat")).toBeDefined();
    // Click again to deselect
    fireEvent.click(screen.getByText("Test Todo"));
    expect(screen.queryByTestId("todo-chat")).toBeNull();
  });

  it("shows TodoChat panel when todo selected", async () => {
    const todos = [makeDocumentTodo({ id: "t1", title: "Chat Todo" })];
    mockListTodos.mockResolvedValue({ documentId: "doc-1", todos });
    render(<TodoList {...defaultProps} />);
    await waitFor(() => screen.getByText("Chat Todo"));
    fireEvent.click(screen.getByText("Chat Todo"));
    const chatPanel = screen.getByTestId("todo-chat");
    expect(chatPanel.textContent).toBe("t1");
  });

  it("calls updateTodoStatus when status icon clicked for open todo", async () => {
    const todos = [makeDocumentTodo({ id: "t1", status: "open" })];
    mockListTodos.mockResolvedValue({ documentId: "doc-1", todos });
    mockUpdateTodoStatus.mockResolvedValue(makeDocumentTodo({ id: "t1", status: "resolved" }));
    render(<TodoList {...defaultProps} />);
    await waitFor(() => screen.getByText("Missing revenue data"));
    // Click the status icon — it's a round div with border-2 and border-gray-300
    const statusIcon = document.querySelector(".rounded-full.border-2");
    expect(statusIcon).not.toBeNull();
    // Re-mock listTodos for the reload after status change
    mockListTodos.mockResolvedValue({
      documentId: "doc-1",
      todos: [makeDocumentTodo({ id: "t1", status: "resolved" })],
    });
    fireEvent.click(statusIcon!);
    await waitFor(() => {
      expect(mockUpdateTodoStatus).toHaveBeenCalledWith("t1", "resolved");
    });
  });

  it("calls updateTodoStatus with skipped when Skip clicked", async () => {
    const todos = [makeDocumentTodo({ id: "t1", status: "open" })];
    mockListTodos.mockResolvedValue({ documentId: "doc-1", todos });
    mockUpdateTodoStatus.mockResolvedValue(makeDocumentTodo({ id: "t1", status: "skipped" }));
    render(<TodoList {...defaultProps} />);
    await waitFor(() => screen.getByText("Skip"));
    fireEvent.click(screen.getByText("Skip"));
    await waitFor(() => {
      expect(mockUpdateTodoStatus).toHaveBeenCalledWith("t1", "skipped");
    });
  });

  it("calls continueGeneration and onContinue when Continue clicked", async () => {
    const todos = [makeDocumentTodo()];
    mockListTodos.mockResolvedValue({ documentId: "doc-1", todos });
    mockContinueGeneration.mockResolvedValue({ message: "started", documentId: "doc-1" });
    render(<TodoList {...defaultProps} />);
    await waitFor(() => screen.getByText("Continue Iterating"));
    fireEvent.click(screen.getByText("Continue Iterating"));
    await waitFor(() => {
      expect(mockContinueGeneration).toHaveBeenCalledWith("doc-1");
      expect(defaultProps.onContinue).toHaveBeenCalled();
    });
  });

  it("calls continueGeneration and onGeneratePdf when Generate PDF clicked", async () => {
    const todos = [makeDocumentTodo()];
    mockListTodos.mockResolvedValue({ documentId: "doc-1", todos });
    mockContinueGeneration.mockResolvedValue({ message: "started", documentId: "doc-1" });
    render(<TodoList {...defaultProps} />);
    await waitFor(() => screen.getByText("Generate PDF"));
    fireEvent.click(screen.getByText("Generate PDF"));
    await waitFor(() => {
      expect(mockContinueGeneration).toHaveBeenCalledWith("doc-1");
      expect(defaultProps.onGeneratePdf).toHaveBeenCalled();
    });
  });

  it("shows priority badge colors", async () => {
    const todos = [
      makeDocumentTodo({ id: "t1", priority: "high" }),
      makeDocumentTodo({ id: "t2", priority: "medium" }),
      makeDocumentTodo({ id: "t3", priority: "low" }),
    ];
    mockListTodos.mockResolvedValue({ documentId: "doc-1", todos });
    const { container } = render(<TodoList {...defaultProps} />);
    await waitFor(() => {
      expect(container.querySelector(".bg-red-100")).not.toBeNull();
      expect(container.querySelector(".bg-amber-100")).not.toBeNull();
      expect(container.querySelector(".bg-gray-100")).not.toBeNull();
    });
  });

  it("shows strikethrough for resolved and skipped todos", async () => {
    const todos = [
      makeDocumentTodo({ id: "t1", status: "resolved", title: "Resolved item" }),
      makeDocumentTodo({ id: "t2", status: "skipped", title: "Skipped item" }),
    ];
    mockListTodos.mockResolvedValue({ documentId: "doc-1", todos });
    render(<TodoList {...defaultProps} />);
    await waitFor(() => {
      const resolved = screen.getByText("Resolved item");
      expect(resolved.className).toContain("line-through");
      const skipped = screen.getByText("Skipped item");
      expect(skipped.className).toContain("line-through");
    });
  });

  it("shows section type label", async () => {
    const todos = [
      makeDocumentTodo({ id: "t1", sectionType: "revenue_summary" }),
    ];
    mockListTodos.mockResolvedValue({ documentId: "doc-1", todos });
    render(<TodoList {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("revenue summary")).toBeDefined();
    });
  });

  it("shows category count", async () => {
    const todos = [
      makeDocumentTodo({ id: "t1", category: "data_gap" }),
      makeDocumentTodo({ id: "t2", category: "data_gap" }),
    ];
    mockListTodos.mockResolvedValue({ documentId: "doc-1", todos });
    render(<TodoList {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("(2)")).toBeDefined();
    });
  });

  it("counts skipped todos as resolved in progress", async () => {
    const todos = [
      makeDocumentTodo({ id: "t1", status: "resolved" }),
      makeDocumentTodo({ id: "t2", status: "skipped" }),
      makeDocumentTodo({ id: "t3", status: "open" }),
    ];
    mockListTodos.mockResolvedValue({ documentId: "doc-1", todos });
    render(<TodoList {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("2 of 3 resolved")).toBeDefined();
    });
  });
});
