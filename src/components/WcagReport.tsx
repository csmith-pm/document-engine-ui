"use client";

import type { WcagIssue, WcagReviewReport } from "@/lib/types";

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  major: "bg-amber-100 text-amber-800 border-amber-200",
  minor: "bg-blue-100 text-blue-800 border-blue-200",
};

function IssueList({ title, issues }: { title: string; issues: WcagIssue[] }) {
  if (issues.length === 0) {
    return (
      <div className="p-3 bg-green-50 border border-green-200 rounded">
        <p className="text-sm text-green-700">{title}: No issues found</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-2">
        {title} ({issues.length} issue{issues.length !== 1 ? "s" : ""})
      </h4>
      <div className="space-y-2">
        {issues.map((issue, i) => (
          <div
            key={i}
            className={`p-3 rounded border ${SEVERITY_STYLES[issue.severity] ?? "bg-gray-100 text-gray-800 border-gray-200"}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase">
                {issue.severity}
              </span>
              <span className="text-xs">{issue.rule}</span>
            </div>
            <p className="text-sm font-medium">{issue.location}</p>
            <p className="text-xs mt-1">{issue.description}</p>
            <p className="text-xs mt-1 italic">Fix: {issue.fix}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WcagReport({
  report,
  passed,
}: {
  report: WcagReviewReport;
  passed: boolean;
}) {
  return (
    <div className="space-y-4">
      <div
        className={`p-4 rounded-lg border ${
          passed
            ? "bg-green-50 border-green-200"
            : "bg-red-50 border-red-200"
        }`}
      >
        <h3 className="text-lg font-semibold text-gray-900">
          WCAG 2.1 AA Compliance
        </h3>
        <p className="text-sm text-gray-600">
          {passed ? "All checks passed" : "Issues require attention"}
        </p>
      </div>

      <IssueList title="PDF Accessibility" issues={report.pdfIssues ?? []} />
      <IssueList title="Web Accessibility" issues={report.webIssues ?? []} />
    </div>
  );
}
