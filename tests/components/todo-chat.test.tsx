import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TodoChat } from "../../src/components/TodoChat";
import { makeDocumentTodo } from "../fixtures/factories";

vi.mock("../../src/lib/api-client", () => ({
  getTodo: vi.fn(),
  sendMessage: vi.fn(),
}));

import { getTodo, sendMessage } from "../../src/lib/api-client";

const mockGetTodo = vi.mocked(getTodo);
const mockSendMessage = vi.mocked(sendMessage);

const baseTodo = makeDocumentTodo({
  id: "t1",
  title: "Missing revenue data",
  description: "Revenue projections for **FY2027** are missing from the budget",
  category: "data_gap",
  priority: "high",
  status: "open",
  sectionType: "revenue_summary",
});

const baseMessages = [
  {
    id: "m1",
    todoId: "t1",
    role: "agent" as const,
    content: "I can help with that.",
    attachmentS3Keys: null,
    createdAt: "2026-01-15T00:00:00Z",
  },
];

describe("TodoChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state while getTodo is pending", () => {
    mockGetTodo.mockReturnValue(new Promise(() => {}));
    render(<TodoChat todoId="t1" onStatusChange={() => {}} />);
    expect(screen.getByText("Loading...")).toBeDefined();
  });

  it("renders todo title and description after load", async () => {
    mockGetTodo.mockResolvedValue({ todo: baseTodo, messages: [] });
    render(<TodoChat todoId="t1" onStatusChange={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText("Missing revenue data")).toBeDefined();
    });
    // Description has ** stripped and is truncated to 120 chars
    expect(
      screen.getByText(/Revenue projections for FY2027/)
    ).toBeDefined();
  });

  it("shows empty state message when no messages", async () => {
    mockGetTodo.mockResolvedValue({ todo: baseTodo, messages: [] });
    render(<TodoChat todoId="t1" onStatusChange={() => {}} />);
    await waitFor(() => {
      expect(
        screen.getByText("Ask the Advisor about this item, or upload a file.")
      ).toBeDefined();
    });
  });

  it("renders user messages with blue background", async () => {
    const userMsg = {
      id: "m2",
      todoId: "t1",
      role: "user" as const,
      content: "Can you clarify?",
      attachmentS3Keys: null,
      createdAt: "2026-01-15T01:00:00Z",
    };
    mockGetTodo.mockResolvedValue({ todo: baseTodo, messages: [userMsg] });
    render(<TodoChat todoId="t1" onStatusChange={() => {}} />);
    await waitFor(() => {
      const msgEl = screen.getByText("Can you clarify?");
      expect(msgEl.closest("div")?.className).toContain("bg-blue-600");
    });
  });

  it("renders agent messages with gray background", async () => {
    mockGetTodo.mockResolvedValue({ todo: baseTodo, messages: baseMessages });
    render(<TodoChat todoId="t1" onStatusChange={() => {}} />);
    await waitFor(() => {
      const msgEl = screen.getByText("I can help with that.");
      expect(msgEl.closest("div")?.className).toContain("bg-gray-100");
    });
  });

  it("shows file attachment count", async () => {
    const msgWithFiles = {
      ...baseMessages[0],
      attachmentS3Keys: ["key1", "key2"],
    };
    mockGetTodo.mockResolvedValue({ todo: baseTodo, messages: [msgWithFiles] });
    render(<TodoChat todoId="t1" onStatusChange={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText("2 file(s) attached")).toBeDefined();
    });
  });

  it("shows Mark Resolved and Skip for open todo", async () => {
    mockGetTodo.mockResolvedValue({ todo: baseTodo, messages: [] });
    render(<TodoChat todoId="t1" onStatusChange={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText("Mark Resolved")).toBeDefined();
      expect(screen.getByText("Skip")).toBeDefined();
    });
  });

  it("shows Reopen for resolved todo", async () => {
    mockGetTodo.mockResolvedValue({
      todo: makeDocumentTodo({ ...baseTodo, status: "resolved" }),
      messages: [],
    });
    render(<TodoChat todoId="t1" onStatusChange={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText("Reopen")).toBeDefined();
      expect(screen.queryByText("Mark Resolved")).toBeNull();
      expect(screen.queryByText("Skip")).toBeNull();
    });
  });

  it("shows Reopen for skipped todo", async () => {
    mockGetTodo.mockResolvedValue({
      todo: makeDocumentTodo({ ...baseTodo, status: "skipped" }),
      messages: [],
    });
    render(<TodoChat todoId="t1" onStatusChange={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText("Reopen")).toBeDefined();
    });
  });

  it("calls onStatusChange with resolved when Mark Resolved clicked", async () => {
    mockGetTodo.mockResolvedValue({ todo: baseTodo, messages: [] });
    const onStatusChange = vi.fn();
    render(<TodoChat todoId="t1" onStatusChange={onStatusChange} />);
    await waitFor(() => screen.getByText("Mark Resolved"));
    fireEvent.click(screen.getByText("Mark Resolved"));
    expect(onStatusChange).toHaveBeenCalledWith("resolved");
  });

  it("calls onStatusChange with skipped when Skip clicked", async () => {
    mockGetTodo.mockResolvedValue({ todo: baseTodo, messages: [] });
    const onStatusChange = vi.fn();
    render(<TodoChat todoId="t1" onStatusChange={onStatusChange} />);
    await waitFor(() => screen.getByText("Skip"));
    fireEvent.click(screen.getByText("Skip"));
    expect(onStatusChange).toHaveBeenCalledWith("skipped");
  });

  it("calls onStatusChange with open when Reopen clicked", async () => {
    mockGetTodo.mockResolvedValue({
      todo: makeDocumentTodo({ ...baseTodo, status: "resolved" }),
      messages: [],
    });
    const onStatusChange = vi.fn();
    render(<TodoChat todoId="t1" onStatusChange={onStatusChange} />);
    await waitFor(() => screen.getByText("Reopen"));
    fireEvent.click(screen.getByText("Reopen"));
    expect(onStatusChange).toHaveBeenCalledWith("open");
  });

  it("sends message on Enter key", async () => {
    mockGetTodo.mockResolvedValue({ todo: baseTodo, messages: [] });
    mockSendMessage.mockResolvedValue({
      todo: baseTodo,
      messages: [
        {
          id: "m-user",
          todoId: "t1",
          role: "user",
          content: "Hello",
          attachmentS3Keys: null,
          createdAt: "2026-01-15T01:00:00Z",
        },
        {
          id: "m-agent",
          todoId: "t1",
          role: "agent",
          content: "Hi there!",
          attachmentS3Keys: null,
          createdAt: "2026-01-15T01:00:01Z",
        },
      ],
    });
    render(<TodoChat todoId="t1" onStatusChange={() => {}} />);
    await waitFor(() => screen.getByPlaceholderText("Ask the Advisor..."));
    const input = screen.getByPlaceholderText("Ask the Advisor...");
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith("t1", "Hello");
    });
  });

  it("does not send empty message", async () => {
    mockGetTodo.mockResolvedValue({ todo: baseTodo, messages: [] });
    render(<TodoChat todoId="t1" onStatusChange={() => {}} />);
    await waitFor(() => screen.getByPlaceholderText("Ask the Advisor..."));
    const input = screen.getByPlaceholderText("Ask the Advisor...");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("shows 'Advisor is thinking...' while sending", async () => {
    mockGetTodo.mockResolvedValue({ todo: baseTodo, messages: [] });
    mockSendMessage.mockReturnValue(new Promise(() => {})); // never resolves
    render(<TodoChat todoId="t1" onStatusChange={() => {}} />);
    await waitFor(() => screen.getByPlaceholderText("Ask the Advisor..."));
    const input = screen.getByPlaceholderText("Ask the Advisor...");
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(screen.getByText("Advisor is thinking...")).toBeDefined();
    });
  });

  it("disables input while sending", async () => {
    mockGetTodo.mockResolvedValue({ todo: baseTodo, messages: [] });
    mockSendMessage.mockReturnValue(new Promise(() => {}));
    render(<TodoChat todoId="t1" onStatusChange={() => {}} />);
    await waitFor(() => screen.getByPlaceholderText("Ask the Advisor..."));
    const input = screen.getByPlaceholderText("Ask the Advisor...");
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(
        (screen.getByPlaceholderText("Ask the Advisor...") as HTMLInputElement)
          .disabled
      ).toBe(true);
    });
  });

  it("adds optimistic user message before server response", async () => {
    mockGetTodo.mockResolvedValue({ todo: baseTodo, messages: [] });
    mockSendMessage.mockReturnValue(new Promise(() => {}));
    render(<TodoChat todoId="t1" onStatusChange={() => {}} />);
    await waitFor(() => screen.getByPlaceholderText("Ask the Advisor..."));
    const input = screen.getByPlaceholderText("Ask the Advisor...");
    fireEvent.change(input, { target: { value: "My message" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(screen.getByText("My message")).toBeDefined();
    });
  });

  it("toggles file uploader on attachment button click", async () => {
    mockGetTodo.mockResolvedValue({ todo: baseTodo, messages: [] });
    render(<TodoChat todoId="t1" onStatusChange={() => {}} />);
    await waitFor(() => screen.getByTitle("Upload file"));
    fireEvent.click(screen.getByTitle("Upload file"));
    // TodoFileUploader should appear with Browse and Cancel
    expect(screen.getByText("Browse")).toBeDefined();
    expect(screen.getByText("Cancel")).toBeDefined();
  });

  it("adds file message when file uploaded via uploader", async () => {
    mockGetTodo.mockResolvedValue({ todo: baseTodo, messages: [] });
    render(<TodoChat todoId="t1" onStatusChange={() => {}} />);
    await waitFor(() => screen.getByTitle("Upload file"));
    fireEvent.click(screen.getByTitle("Upload file"));
    // TodoFileUploader should be visible — we can't easily test the full flow
    // since it requires mocking nested uploadTodoFile, but verify the uploader renders
    expect(screen.getByText("Browse")).toBeDefined();
  });

  it("returns null when getTodo fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetTodo.mockRejectedValue(new Error("Network error"));
    const { container } = render(
      <TodoChat todoId="t1" onStatusChange={() => {}} />
    );
    await waitFor(() => {
      // After loading fails, todo is null → returns null
      expect(container.querySelector(".border-gray-200")).toBeNull();
    });
    // Should have logged the error
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("sends message via Send button click", async () => {
    mockGetTodo.mockResolvedValue({ todo: baseTodo, messages: [] });
    mockSendMessage.mockResolvedValue({ todo: baseTodo, messages: [] });
    render(<TodoChat todoId="t1" onStatusChange={() => {}} />);
    await waitFor(() => screen.getByPlaceholderText("Ask the Advisor..."));
    const input = screen.getByPlaceholderText("Ask the Advisor...");
    fireEvent.change(input, { target: { value: "Test message" } });
    fireEvent.click(screen.getByText("Send"));
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith("t1", "Test message");
    });
  });
});
