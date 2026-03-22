import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReviewCard } from "../../src/components/ReviewCard";
import type { DocumentReview } from "../../src/lib/types";

function makeReview(overrides: Partial<DocumentReview> = {}): DocumentReview {
  return {
    id: "r1",
    documentId: "d1",
    tenantId: "t1",
    reviewerType: "BB_Reviewer",
    iteration: 0,
    overallScore: "145.50",
    passed: true,
    report: {
      criteriaName: "GFOA Distinguished Budget Award",
      maxScore: 180,
      scores: [
        {
          category: "Financial Policies",
          maxPoints: 40,
          awardedPoints: 35,
          feedback: "Good coverage",
        },
        {
          category: "Revenue Analysis",
          maxPoints: 30,
          awardedPoints: 20,
          feedback: "Needs more detail",
        },
      ],
    },
    recommendations: null,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("ReviewCard", () => {
  it("renders criteria name from report", () => {
    render(<ReviewCard review={makeReview()} />);
    expect(
      screen.getByText("GFOA Distinguished Budget Award")
    ).toBeDefined();
  });

  it("renders overall score", () => {
    render(<ReviewCard review={makeReview()} />);
    expect(screen.getByText("145.5")).toBeDefined();
    expect(screen.getByText("/180")).toBeDefined();
  });

  it("renders category breakdowns", () => {
    render(<ReviewCard review={makeReview()} />);
    expect(screen.getByText("Financial Policies")).toBeDefined();
    expect(screen.getByText("35/40")).toBeDefined();
    expect(screen.getByText("Revenue Analysis")).toBeDefined();
    expect(screen.getByText("20/30")).toBeDefined();
  });

  it("shows passed state", () => {
    render(<ReviewCard review={makeReview({ passed: true })} />);
    expect(screen.getByText("Meets criteria")).toBeDefined();
  });

  it("shows failed state", () => {
    render(<ReviewCard review={makeReview({ passed: false })} />);
    expect(screen.getByText("Below target threshold")).toBeDefined();
  });

  it("renders PAFR-style review with different criteria", () => {
    render(
      <ReviewCard
        review={makeReview({
          reviewerType: "PAFR_Reviewer",
          overallScore: "82.00",
          report: {
            criteriaName: "Excellence in Popular Reporting",
            maxScore: 100,
            scores: [
              {
                category: "Reader Appeal",
                maxPoints: 25,
                awardedPoints: 22,
                feedback: "Strong",
              },
            ],
          },
        })}
      />
    );
    expect(
      screen.getByText("Excellence in Popular Reporting")
    ).toBeDefined();
    expect(screen.getByText("82")).toBeDefined();
    expect(screen.getByText("/100")).toBeDefined();
  });
});
