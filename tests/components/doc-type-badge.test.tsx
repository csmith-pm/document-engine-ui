import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DocTypeBadge } from "../../src/components/DocTypeBadge";

describe("DocTypeBadge", () => {
  it("renders Budget Book for budget_book", () => {
    render(<DocTypeBadge docType="budget_book" />);
    expect(screen.getByText("Budget Book")).toBeDefined();
  });

  it("renders Popular Annual Financial Report for pafr", () => {
    render(<DocTypeBadge docType="pafr" />);
    expect(screen.getByText("Popular Annual Financial Report")).toBeDefined();
  });

  it("falls back to underscore-to-space for unknown type", () => {
    render(<DocTypeBadge docType="cafr_report" />);
    expect(screen.getByText("cafr report")).toBeDefined();
  });

  it("has indigo badge styling", () => {
    const { container } = render(<DocTypeBadge docType="budget_book" />);
    const badge = container.querySelector("span");
    expect(badge?.className).toContain("bg-indigo-100");
  });
});
