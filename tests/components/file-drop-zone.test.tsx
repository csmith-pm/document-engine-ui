import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileDropZone } from "../../src/components/FileDropZone";

describe("FileDropZone", () => {
  it("renders label text", () => {
    render(<FileDropZone accept=".csv" label="Drop your file here" onFile={() => {}} />);
    expect(screen.getByText("Drop your file here")).toBeDefined();
  });

  it("shows Uploading when uploading is true", () => {
    render(<FileDropZone accept=".csv" label="Drop" onFile={() => {}} uploading={true} />);
    expect(screen.getByText("Uploading...")).toBeDefined();
  });

  it("calls onFile when file input changes", () => {
    const onFile = vi.fn();
    render(<FileDropZone accept=".csv" label="Drop" onFile={onFile} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["data"], "budget.csv", { type: "text/csv" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onFile).toHaveBeenCalledWith(file);
  });

  it("calls onFile when file is dropped", () => {
    const onFile = vi.fn();
    const { container } = render(<FileDropZone accept=".csv" label="Drop" onFile={onFile} />);
    const dropZone = container.firstChild as HTMLElement;
    const file = new File(["data"], "budget.csv", { type: "text/csv" });
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });
    expect(onFile).toHaveBeenCalledWith(file);
  });

  it("applies active drag styling on dragOver", () => {
    const { container } = render(<FileDropZone accept=".csv" label="Drop" onFile={() => {}} />);
    const dropZone = container.firstChild as HTMLElement;
    fireEvent.dragOver(dropZone);
    expect(dropZone.className).toContain("border-blue-500");
  });

  it("removes active drag styling on dragLeave", () => {
    const { container } = render(<FileDropZone accept=".csv" label="Drop" onFile={() => {}} />);
    const dropZone = container.firstChild as HTMLElement;
    fireEvent.dragOver(dropZone);
    fireEvent.dragLeave(dropZone);
    expect(dropZone.className).not.toContain("border-blue-500");
  });

  it("file input has correct accept attribute", () => {
    render(<FileDropZone accept=".xlsx,.csv" label="Drop" onFile={() => {}} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.accept).toBe(".xlsx,.csv");
  });
});
