import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WcagReport } from "../../src/components/WcagReport";
import type { WcagReviewReport } from "../../src/lib/types";

describe("WcagReport", () => {
  it("renders WCAG 2.1 AA heading", () => {
    const report: WcagReviewReport = {
      pdfIssues: [],
      webIssues: [],
      passed: true,
    };
    render(<WcagReport report={report} passed={true} />);
    expect(screen.getByText("WCAG 2.1 AA Compliance")).toBeDefined();
  });

  it("shows passed state", () => {
    const report: WcagReviewReport = {
      pdfIssues: [],
      webIssues: [],
      passed: true,
    };
    render(<WcagReport report={report} passed={true} />);
    expect(screen.getByText("All checks passed")).toBeDefined();
  });

  it("shows issues when not passed", () => {
    const report: WcagReviewReport = {
      pdfIssues: [
        {
          rule: "1.1.1",
          severity: "critical",
          location: "Page 3",
          description: "Missing alt text",
          fix: "Add alt text to image",
        },
      ],
      webIssues: [],
      passed: false,
    };
    render(<WcagReport report={report} passed={false} />);
    expect(screen.getByText("Issues require attention")).toBeDefined();
    expect(screen.getByText("Missing alt text")).toBeDefined();
    expect(screen.getByText("Fix: Add alt text to image")).toBeDefined();
  });
});
