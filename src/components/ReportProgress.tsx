"use client";

import type { DocumentJob } from "@/lib/types";

const JOB_LABELS: Record<string, string> = {
  seed_skills: "Seed Skills",
  analyze_prior_pdf: "Analyze Prior Document",
  fetch_data: "Fetch Data",
  detect_gaps: "Detect Data Gaps",
  generate_sections: "Generate Sections",
  render_charts: "Render Charts",
  review_and_iterate: "Review & Iterate",
  render_pdf: "Render PDF",
  finalize: "Finalize",
};

const STATUS_ICONS: Record<string, string> = {
  pending: "\u23f3",
  running: "\ud83d\udd04",
  completed: "\u2705",
  failed: "\u274c",
};

export function ReportProgress({
  jobs,
  status,
  currentIteration,
  maxIterations,
}: {
  jobs: DocumentJob[];
  status: string;
  currentIteration: number;
  maxIterations: number;
}) {
  const completedCount = jobs.filter((j) => j.status === "completed").length;
  const overallProgress =
    jobs.length > 0 ? Math.round((completedCount / jobs.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-gray-700">
            Overall Progress &mdash; {status.replace(/_/g, " ")}
          </span>
          <span className="text-gray-500">{overallProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Scan {currentIteration + 1} of {maxIterations}
        </p>
      </div>

      <div className="space-y-2">
        {jobs.map((job) => (
          <div
            key={job.id}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              job.status === "running"
                ? "bg-blue-50 border-blue-200"
                : job.status === "failed"
                  ? "bg-red-50 border-red-200"
                  : job.status === "completed"
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 border-gray-200"
            }`}
          >
            <span className="text-lg">
              {STATUS_ICONS[job.status] ?? "\u23f3"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {JOB_LABELS[job.jobType] ?? job.jobType.replace(/_/g, " ")}
              </p>
              {job.message && (
                <p className="text-xs text-gray-600 truncate">{job.message}</p>
              )}
              {job.error && (
                <p className="text-xs text-red-600 truncate">{job.error}</p>
              )}
            </div>
            {job.status === "running" && (
              <div className="w-16">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
