"use client";

import type { DocumentReview, CriteriaReviewReport, ReviewCategoryScore } from "@/lib/types";

/**
 * Generic review score card. Reads criteria name and scoring from the review
 * report data — never hardcodes any specific criteria (GFOA, PAFR, etc.).
 */
export function ReviewCard({ review }: { review: DocumentReview }) {
  const report = review.report as Partial<CriteriaReviewReport>;
  const criteriaName = report.criteriaName ?? review.reviewerType.replace(/_/g, " ");
  const maxScore = report.maxScore ?? 0;
  const scores = (report.scores ?? []) as ReviewCategoryScore[];
  const totalScore = review.overallScore ? parseFloat(review.overallScore) : 0;

  return (
    <div className="space-y-4">
      {/* Overall score */}
      <div
        className={`p-4 rounded-lg border ${
          review.passed
            ? "bg-green-50 border-green-200"
            : "bg-amber-50 border-amber-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {criteriaName}
            </h3>
            <p className="text-sm text-gray-600">
              {review.passed
                ? "Meets criteria"
                : "Below target threshold"}
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-gray-900">
              {totalScore}
            </span>
            {maxScore > 0 && (
              <span className="text-lg text-gray-500">/{maxScore}</span>
            )}
          </div>
        </div>
      </div>

      {/* Category breakdowns */}
      {scores.length > 0 && (
        <div className="space-y-2">
          {scores.map((score) => {
            const pct =
              score.maxPoints > 0
                ? (score.awardedPoints / score.maxPoints) * 100
                : 0;
            return (
              <div key={score.category} className="p-3 bg-white rounded border">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    {score.category}
                  </span>
                  <span className="text-sm text-gray-500">
                    {score.awardedPoints}/{score.maxPoints}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      pct >= 80
                        ? "bg-green-500"
                        : pct >= 50
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {score.feedback && (
                  <p className="text-xs text-gray-500 mt-1">{score.feedback}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Recommendations */}
      {review.recommendations && review.recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Recommendations
          </h4>
          <ul className="list-disc list-inside space-y-1">
            {review.recommendations.map((rec, i) => (
              <li key={i} className="text-xs text-gray-600">
                {typeof rec === "string" ? rec : JSON.stringify(rec)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
