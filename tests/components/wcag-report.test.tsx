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

  it("applies correct severity styling", () => {
    const report: WcagReviewReport = {
      pdfIssues: [
        { rule: "1.1.1", severity: "critical", location: "P1", description: "Critical issue", fix: "Fix it" },
        { rule: "1.3.1", severity: "major", location: "P2", description: "Major issue", fix: "Fix it" },
        { rule: "2.4.1", severity: "minor", location: "P3", description: "Minor issue", fix: "Fix it" },
      ],
      webIssues: [],
      passed: false,
    };
    const { container } = render(<WcagReport report={report} passed={false} />);
    expect(container.querySelector(".bg-red-100")).not.toBeNull();
    expect(container.querySelector(".bg-amber-100")).not.toBeNull();
    expect(container.querySelector(".bg-blue-100")).not.toBeNull();
  });

  it("renders both PDF and web issues in separate sections", () => {
    const report: WcagReviewReport = {
      pdfIssues: [
        { rule: "1.1.1", severity: "critical", location: "P1", description: "PDF issue", fix: "Fix pdf" },
      ],
      webIssues: [
        { rule: "2.1.1", severity: "major", location: "Nav", description: "Web issue", fix: "Fix web" },
      ],
      passed: false,
    };
    render(<WcagReport report={report} passed={false} />);
    expect(screen.getByText("PDF issue")).toBeDefined();
    expect(screen.getByText("Web issue")).toBeDefined();
    expect(screen.getByText(/PDF Accessibility/)).toBeDefined();
    expect(screen.getByText(/Web Accessibility/)).toBeDefined();
  });

  it("shows issue count with correct plural", () => {
    const report: WcagReviewReport = {
      pdfIssues: [
        { rule: "1.1.1", severity: "critical", location: "P1", description: "Issue 1", fix: "Fix 1" },
        { rule: "1.1.2", severity: "major", location: "P2", description: "Issue 2", fix: "Fix 2" },
        { rule: "1.1.3", severity: "minor", location: "P3", description: "Issue 3", fix: "Fix 3" },
      ],
      webIssues: [
        { rule: "2.1.1", severity: "major", location: "Nav", description: "Web 1", fix: "Fix web" },
      ],
      passed: false,
    };
    render(<WcagReport report={report} passed={false} />);
    expect(screen.getByText("PDF Accessibility (3 issues)")).toBeDefined();
    expect(screen.getByText("Web Accessibility (1 issue)")).toBeDefined();
  });

  it("shows 'No issues found' for empty category", () => {
    const report: WcagReviewReport = {
      pdfIssues: [],
      webIssues: [],
      passed: true,
    };
    render(<WcagReport report={report} passed={true} />);
    expect(screen.getByText("PDF Accessibility: No issues found")).toBeDefined();
    expect(screen.getByText("Web Accessibility: No issues found")).toBeDefined();
  });

  it("displays rule, severity, location, description, and fix for each issue", () => {
    const report: WcagReviewReport = {
      pdfIssues: [
        { rule: "1.4.3", severity: "major", location: "Header section", description: "Low contrast ratio", fix: "Increase text contrast" },
      ],
      webIssues: [],
      passed: false,
    };
    render(<WcagReport report={report} passed={false} />);
    expect(screen.getByText("1.4.3")).toBeDefined();
    expect(screen.getByText("major")).toBeDefined();
    expect(screen.getByText("Header section")).toBeDefined();
    expect(screen.getByText("Low contrast ratio")).toBeDefined();
    expect(screen.getByText("Fix: Increase text contrast")).toBeDefined();
  });
});
