"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  getReport,
  getProgress,
  getPreview,
  getReviews,
  getPdfUrl,
  startGeneration,
} from "@/lib/api-client";
import { usePoll } from "@/lib/use-poll";
import { Stepper } from "@/components/Stepper";
import { ReportProgress } from "@/components/ReportProgress";
import { TodoList } from "@/components/TodoList";
import { SectionPreview } from "@/components/SectionPreview";
import { ReviewCard } from "@/components/ReviewCard";
import { WcagReport } from "@/components/WcagReport";
import { StatusBadge } from "@/components/StatusBadge";
import { DocTypeBadge } from "@/components/DocTypeBadge";
import type {
  Document,
  DocumentJob,
  DocumentSection,
  DocumentReview,
  DocumentStatus,
  WcagReviewReport,
} from "@/lib/types";

type ViewTab = "scanning" | "todos" | "preview" | "review" | "download";

const ACTIVE_STATUSES: DocumentStatus[] = [
  "analyzing",
  "generating",
  "reviewing",
  "revision",
];

function getStepFromStatus(status: DocumentStatus): string {
  if (status === "draft") return "upload";
  if (ACTIVE_STATUSES.includes(status)) return "scanning";
  if (status === "completed_with_todos") return "todos";
  if (status === "completed") return "download";
  if (status === "failed") return "scanning";
  return "scanning";
}

function getViewFromStatus(status: DocumentStatus): ViewTab {
  if (ACTIVE_STATUSES.includes(status)) return "scanning";
  if (status === "completed_with_todos") return "todos";
  if (status === "completed") return "download";
  if (status === "failed") return "scanning";
  return "scanning";
}

export default function ReportDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [doc, setDoc] = useState<Document | null>(null);
  const [jobs, setJobs] = useState<DocumentJob[]>([]);
  const [sections, setSections] = useState<DocumentSection[]>([]);
  const [reviews, setReviews] = useState<DocumentReview[]>([]);
  const [activeTab, setActiveTab] = useState<ViewTab>("scanning");
  const [loading, setLoading] = useState(true);

  // Initial load
  useEffect(() => {
    async function load() {
      try {
        const report = await getReport(id);
        setDoc(report);
        setActiveTab(getViewFromStatus(report.status));
      } catch (err) {
        console.error("Failed to load report:", err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  const isScanning = doc ? ACTIVE_STATUSES.includes(doc.status) : false;

  // Poll progress while scanning
  const { data: progressData } = usePoll(
    () => getProgress(id),
    3000,
    isScanning
  );

  useEffect(() => {
    if (progressData) {
      setJobs(progressData.jobs);
    }
  }, [progressData]);

  // Poll for document status changes
  const { data: latestDoc } = usePoll(() => getReport(id), 3000, isScanning);

  useEffect(() => {
    if (latestDoc) {
      setDoc(latestDoc);
      // Auto-advance when scanning finishes
      if (!ACTIVE_STATUSES.includes(latestDoc.status) && isScanning) {
        setActiveTab(getViewFromStatus(latestDoc.status));
      }
    }
  }, [latestDoc, isScanning]);

  // Poll preview while generating
  const { data: previewData } = usePoll(
    () => getPreview(id),
    5000,
    activeTab === "preview" || (isScanning && activeTab === "scanning")
  );

  useEffect(() => {
    if (previewData) {
      setSections(
        previewData.sections.sort(
          (a: DocumentSection, b: DocumentSection) =>
            a.sectionOrder - b.sectionOrder
        )
      );
    }
  }, [previewData]);

  // Load reviews on tab switch
  useEffect(() => {
    if (activeTab === "review" || activeTab === "download") {
      getReviews(id)
        .then((r) => setReviews(r.reviews))
        .catch((err) => console.error("Failed to load reviews:", err));
    }
  }, [activeTab, id]);

  // Load preview on tab switch
  useEffect(() => {
    if (activeTab === "preview" && sections.length === 0) {
      getPreview(id)
        .then((r) =>
          setSections(
            r.sections.sort(
              (a: DocumentSection, b: DocumentSection) =>
                a.sectionOrder - b.sectionOrder
            )
          )
        )
        .catch((err) => console.error("Failed to load preview:", err));
    }
  }, [activeTab, id, sections.length]);

  const handleContinue = useCallback(() => {
    if (doc) {
      setDoc({ ...doc, status: "generating" });
      setActiveTab("scanning");
    }
  }, [doc]);

  const handleGeneratePdf = useCallback(() => {
    if (doc) {
      setDoc({ ...doc, status: "generating" });
      setActiveTab("scanning");
    }
  }, [doc]);

  const handleRetry = useCallback(async () => {
    try {
      await startGeneration(id);
      if (doc) {
        setDoc({ ...doc, status: "generating" });
        setActiveTab("scanning");
      }
    } catch (err) {
      console.error("Failed to retry:", err);
    }
  }, [id, doc]);

  if (loading || !doc) {
    return <p className="text-gray-500">Loading report...</p>;
  }

  const currentStep = getStepFromStatus(doc.status);

  // Separate criteria reviews from WCAG reviews
  const criteriaReviews = reviews.filter(
    (r) => !r.reviewerType.toLowerCase().includes("ada")
  );
  const wcagReviews = reviews.filter((r) =>
    r.reviewerType.toLowerCase().includes("ada")
  );

  const tabs: { key: ViewTab; label: string; enabled: boolean }[] = [
    { key: "scanning", label: "Progress", enabled: true },
    { key: "todos", label: "Todos", enabled: true },
    { key: "preview", label: "Preview", enabled: true },
    { key: "review", label: "Review", enabled: true },
    { key: "download", label: "Download", enabled: doc.status === "completed" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{doc.title}</h1>
            <DocTypeBadge docType={doc.docType} />
            <StatusBadge status={doc.status} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            FY{doc.fiscalYear}
          </p>
        </div>
      </div>

      {/* Stepper */}
      <Stepper
        currentStep={currentStep}
        iteration={doc.currentIteration + 1}
        maxIterations={doc.maxIterations}
      />

      {/* Tab bar */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => tab.enabled && setActiveTab(tab.key)}
              disabled={!tab.enabled}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : tab.enabled
                    ? "border-transparent text-gray-500 hover:text-gray-700"
                    : "border-transparent text-gray-300 cursor-not-allowed"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}

      {activeTab === "scanning" && (
        <div>
          {doc.status === "failed" ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-800 font-medium mb-2">
                Generation failed
              </p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
              >
                Retry
              </button>
            </div>
          ) : (
            <ReportProgress
              jobs={jobs}
              status={doc.status}
              currentIteration={doc.currentIteration}
              maxIterations={doc.maxIterations}
            />
          )}
        </div>
      )}

      {activeTab === "todos" && (
        <TodoList
          documentId={id}
          currentIteration={doc.currentIteration}
          maxIterations={doc.maxIterations}
          onContinue={handleContinue}
          onGeneratePdf={handleGeneratePdf}
        />
      )}

      {activeTab === "preview" && (
        <div className="space-y-8">
          {sections.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {isScanning
                ? "Sections will appear here as they are generated..."
                : "No sections available yet."}
            </p>
          ) : (
            sections.map((section) => (
              <SectionPreview key={section.id} section={section} />
            ))
          )}
        </div>
      )}

      {activeTab === "review" && (
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No reviews available yet.
            </p>
          ) : (
            <>
              {criteriaReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
              {wcagReviews.map((review) => (
                <WcagReport
                  key={review.id}
                  report={review.report as unknown as WcagReviewReport}
                  passed={review.passed}
                />
              ))}
            </>
          )}
        </div>
      )}

      {activeTab === "download" && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Report Complete
          </h2>
          <p className="text-sm text-gray-500 mb-1">
            Completed in {doc.currentIteration + 1} of {doc.maxIterations} scans
          </p>

          {/* Final scores summary */}
          {criteriaReviews.length > 0 && (
            <div className="my-4 inline-flex items-center gap-2">
              {criteriaReviews
                .filter((r) => r.iteration === doc.currentIteration)
                .map((r) => (
                  <span
                    key={r.id}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      r.passed
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {r.passed ? "Criteria Met" : "Below Target"} (
                    {r.overallScore ?? "N/A"})
                  </span>
                ))}
              {wcagReviews
                .filter((r) => r.iteration === doc.currentIteration)
                .map((r) => (
                  <span
                    key={r.id}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      r.passed
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    WCAG 2.1 AA: {r.passed ? "Compliant" : "Issues Found"}
                  </span>
                ))}
            </div>
          )}

          <div className="mt-6">
            <a
              href={getPdfUrl(id)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-lg"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download PDF
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
