import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TodoFileUploader } from "../../src/components/TodoFileUploader";

vi.mock("../../src/lib/api-client", () => ({
  uploadTodoFile: vi.fn(),
}));

import { uploadTodoFile } from "../../src/lib/api-client";

const mockUpload = vi.mocked(uploadTodoFile);

describe("TodoFileUploader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders drop zone with Browse and Cancel", () => {
    render(<TodoFileUploader todoId="t1" onUploaded={() => {}} onCancel={() => {}} />);
    expect(screen.getByText("Browse")).toBeDefined();
    expect(screen.getByText("Cancel")).toBeDefined();
  });

  it("shows Uploading during upload", async () => {
    mockUpload.mockReturnValue(new Promise(() => {})); // never resolves
    render(<TodoFileUploader todoId="t1" onUploaded={() => {}} onCancel={() => {}} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["data"], "test.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText("Uploading...")).toBeDefined();
    });
  });

  it("calls uploadTodoFile on file select", async () => {
    mockUpload.mockResolvedValue({ s3Key: "key123" });
    render(<TodoFileUploader todoId="t1" onUploaded={() => {}} onCancel={() => {}} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["data"], "test.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith("t1", file);
    });
  });

  it("calls onUploaded with s3Key and fileName on success", async () => {
    mockUpload.mockResolvedValue({ s3Key: "key123" });
    const onUploaded = vi.fn();
    render(<TodoFileUploader todoId="t1" onUploaded={onUploaded} onCancel={() => {}} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["data"], "budget.csv", { type: "text/csv" });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(onUploaded).toHaveBeenCalledWith("key123", "budget.csv");
    });
  });

  it("calls onCancel when Cancel clicked", () => {
    const onCancel = vi.fn();
    render(<TodoFileUploader todoId="t1" onUploaded={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("calls uploadTodoFile on file drop", async () => {
    mockUpload.mockResolvedValue({ s3Key: "key456" });
    const { container } = render(
      <TodoFileUploader todoId="t1" onUploaded={() => {}} onCancel={() => {}} />
    );
    const dropZone = container.firstChild as HTMLElement;
    const file = new File(["data"], "test.xlsx", { type: "application/octet-stream" });
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });
    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith("t1", file);
    });
  });

  it("shows alert on upload failure", async () => {
    mockUpload.mockRejectedValue(new Error("Upload failed"));
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<TodoFileUploader todoId="t1" onUploaded={() => {}} onCancel={() => {}} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["data"], "test.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("File upload failed. Please try again.");
    });
    alertSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it("applies active drag styling on dragOver", () => {
    const { container } = render(
      <TodoFileUploader todoId="t1" onUploaded={() => {}} onCancel={() => {}} />
    );
    const dropZone = container.firstChild as HTMLElement;
    fireEvent.dragOver(dropZone);
    expect(dropZone.className).toContain("border-blue-500");
  });
});
