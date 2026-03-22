import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionPreview } from "../../src/components/SectionPreview";
import { makeChartConfig, makeTableRows } from "../fixtures/factories";

describe("SectionPreview", () => {
  it("renders section title in h2", () => {
    render(
      <SectionPreview
        section={{ title: "Revenue Summary", narrativeContent: null, tableData: null, chartConfigs: null }}
      />
    );
    expect(screen.getByText("Revenue Summary")).toBeDefined();
  });

  it("renders narrative paragraphs split by double newline", () => {
    render(
      <SectionPreview
        section={{
          title: "Test",
          narrativeContent: "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.",
          tableData: null,
          chartConfigs: null,
        }}
      />
    );
    expect(screen.getByText("First paragraph.")).toBeDefined();
    expect(screen.getByText("Second paragraph.")).toBeDefined();
    expect(screen.getByText("Third paragraph.")).toBeDefined();
  });

  it("handles null narrativeContent gracefully", () => {
    const { container } = render(
      <SectionPreview
        section={{ title: "Test", narrativeContent: null, tableData: null, chartConfigs: null }}
      />
    );
    // Should render without errors, just title
    expect(container.querySelector("h2")).not.toBeNull();
  });

  it("renders table with header in thead and data in tbody", () => {
    const tableData = makeTableRows();
    const { container } = render(
      <SectionPreview
        section={{ title: "Test", narrativeContent: null, tableData, chartConfigs: null }}
      />
    );
    const thead = container.querySelector("thead");
    const tbody = container.querySelector("tbody");
    expect(thead).not.toBeNull();
    expect(tbody).not.toBeNull();
    // Header row has 4 cells
    const ths = thead!.querySelectorAll("th");
    expect(ths.length).toBe(4);
    expect(ths[0].textContent).toBe("Category");
    // Data rows
    const trs = tbody!.querySelectorAll("tr");
    expect(trs.length).toBe(3);
  });

  it("right-aligns numeric columns (ci > 0)", () => {
    const tableData = makeTableRows();
    const { container } = render(
      <SectionPreview
        section={{ title: "Test", narrativeContent: null, tableData, chartConfigs: null }}
      />
    );
    const ths = container.querySelectorAll("th");
    expect(ths[0].className).toContain("text-left");
    expect(ths[1].className).toContain("text-right");
  });

  it("renders bar chart for bar type", () => {
    const { container } = render(
      <SectionPreview
        section={{
          title: "Test",
          narrativeContent: null,
          tableData: null,
          chartConfigs: [makeChartConfig("bar")],
        }}
      />
    );
    expect(container.querySelector('[data-testid="bar-chart"]')).not.toBeNull();
  });

  it("renders pie chart for pie type", () => {
    const { container } = render(
      <SectionPreview
        section={{
          title: "Test",
          narrativeContent: null,
          tableData: null,
          chartConfigs: [makeChartConfig("pie")],
        }}
      />
    );
    expect(container.querySelector('[data-testid="pie-chart"]')).not.toBeNull();
  });

  it("renders line chart for line type", () => {
    const { container } = render(
      <SectionPreview
        section={{
          title: "Test",
          narrativeContent: null,
          tableData: null,
          chartConfigs: [makeChartConfig("line")],
        }}
      />
    );
    expect(container.querySelector('[data-testid="line-chart"]')).not.toBeNull();
  });

  it("renders multiple charts", () => {
    const { container } = render(
      <SectionPreview
        section={{
          title: "Test",
          narrativeContent: null,
          tableData: null,
          chartConfigs: [makeChartConfig("bar"), makeChartConfig("pie")],
        }}
      />
    );
    expect(container.querySelector('[data-testid="bar-chart"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="pie-chart"]')).not.toBeNull();
  });

  it("renders chart title", () => {
    render(
      <SectionPreview
        section={{
          title: "Test",
          narrativeContent: null,
          tableData: null,
          chartConfigs: [makeChartConfig("bar")],
        }}
      />
    );
    expect(screen.getByText("Bar Chart")).toBeDefined();
  });

  it("handles empty tableData and chartConfigs gracefully", () => {
    const { container } = render(
      <SectionPreview
        section={{ title: "Test", narrativeContent: null, tableData: [], chartConfigs: [] }}
      />
    );
    expect(container.querySelector("table")).toBeNull();
    expect(container.querySelector('[data-testid="bar-chart"]')).toBeNull();
  });
});
