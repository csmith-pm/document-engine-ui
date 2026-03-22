import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReportProgress } from "../../src/components/ReportProgress";
import { makeDocumentJob } from "../fixtures/factories";

describe("ReportProgress", () => {
  it("renders Overall Progress heading with status", () => {
    render(
      <ReportProgress jobs={[]} status="generating" currentIteration={0} maxIterations={5} />
    );
    expect(screen.getByText(/Overall Progress/)).toBeDefined();
    expect(screen.getByText(/generating/)).toBeDefined();
  });

  it("shows 0% when jobs array is empty", () => {
    render(
      <ReportProgress jobs={[]} status="generating" currentIteration={0} maxIterations={5} />
    );
    expect(screen.getByText("0%")).toBeDefined();
  });

  it("shows correct percentage for completed jobs", () => {
    const jobs = [
      makeDocumentJob({ id: "j1", status: "completed" }),
      makeDocumentJob({ id: "j2", status: "completed" }),
      makeDocumentJob({ id: "j3", status: "running" }),
      makeDocumentJob({ id: "j4", status: "pending" }),
    ];
    render(
      <ReportProgress jobs={jobs} status="generating" currentIteration={0} maxIterations={5} />
    );
    expect(screen.getByText("50%")).toBeDefined();
  });

  it("shows iteration counter", () => {
    render(
      <ReportProgress jobs={[]} status="generating" currentIteration={1} maxIterations={5} />
    );
    expect(screen.getByText("Scan 2 of 5")).toBeDefined();
  });

  it("renders job labels from JOB_LABELS map", () => {
    const jobs = [
      makeDocumentJob({ jobType: "generate_sections" }),
    ];
    render(
      <ReportProgress jobs={jobs} status="generating" currentIteration={0} maxIterations={5} />
    );
    expect(screen.getByText("Generate Sections")).toBeDefined();
  });

  it("falls back to snake_case-to-space for unknown job types", () => {
    const jobs = [
      makeDocumentJob({ jobType: "custom_step_one" }),
    ];
    render(
      <ReportProgress jobs={jobs} status="generating" currentIteration={0} maxIterations={5} />
    );
    expect(screen.getByText("custom step one")).toBeDefined();
  });

  it("shows job message when present", () => {
    const jobs = [
      makeDocumentJob({ message: "Processing page 3 of 10" }),
    ];
    render(
      <ReportProgress jobs={jobs} status="generating" currentIteration={0} maxIterations={5} />
    );
    expect(screen.getByText("Processing page 3 of 10")).toBeDefined();
  });

  it("shows job error in red when present", () => {
    const jobs = [
      makeDocumentJob({ status: "failed", error: "Out of memory" }),
    ];
    const { container } = render(
      <ReportProgress jobs={jobs} status="failed" currentIteration={0} maxIterations={5} />
    );
    const errorEl = screen.getByText("Out of memory");
    expect(errorEl.className).toContain("text-red-600");
    // Job card should have red background
    const card = container.querySelector(".bg-red-50");
    expect(card).not.toBeNull();
  });

  it("shows progress bar for running jobs", () => {
    const jobs = [
      makeDocumentJob({ status: "running", progress: 75 }),
    ];
    const { container } = render(
      <ReportProgress jobs={jobs} status="generating" currentIteration={0} maxIterations={5} />
    );
    const progressBar = container.querySelector('[style*="width: 75%"]');
    expect(progressBar).not.toBeNull();
  });

  it("applies correct color classes per status", () => {
    const jobs = [
      makeDocumentJob({ id: "j1", status: "running" }),
      makeDocumentJob({ id: "j2", status: "completed" }),
      makeDocumentJob({ id: "j3", status: "pending" }),
    ];
    const { container } = render(
      <ReportProgress jobs={jobs} status="generating" currentIteration={0} maxIterations={5} />
    );
    expect(container.querySelector(".bg-blue-50")).not.toBeNull();
    expect(container.querySelector(".bg-green-50")).not.toBeNull();
    expect(container.querySelector(".bg-gray-50")).not.toBeNull();
  });

  it("replaces underscores with spaces in status display", () => {
    render(
      <ReportProgress jobs={[]} status="completed_with_todos" currentIteration={0} maxIterations={5} />
    );
    expect(screen.getByText(/completed with todos/)).toBeDefined();
  });
});
