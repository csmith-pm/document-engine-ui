import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Stepper } from "../../src/components/Stepper";

describe("Stepper", () => {
  it("renders all default steps", () => {
    render(<Stepper currentStep="scanning" />);
    expect(screen.getByText("Upload")).toBeDefined();
    expect(screen.getByText("Scanning")).toBeDefined();
    expect(screen.getByText("Todos")).toBeDefined();
    expect(screen.getByText("Preview")).toBeDefined();
    expect(screen.getByText("Review")).toBeDefined();
    expect(screen.getByText("Download")).toBeDefined();
  });

  it("shows iteration counter", () => {
    render(<Stepper currentStep="scanning" iteration={2} maxIterations={5} />);
    expect(screen.getByText("Scan 2 of 5")).toBeDefined();
  });

  it("does not show iteration counter when not provided", () => {
    render(<Stepper currentStep="todos" />);
    expect(screen.queryByText(/Scan \d+ of \d+/)).toBeNull();
  });

  it("highlights current step blue and completed steps green", () => {
    const { container } = render(<Stepper currentStep="todos" />);
    const circles = container.querySelectorAll(".rounded-full");
    // Upload (0) = completed → green, Scanning (1) = completed → green, Todos (2) = active → blue
    expect(circles[0].className).toContain("bg-green-500");
    expect(circles[1].className).toContain("bg-green-500");
    expect(circles[2].className).toContain("bg-blue-600");
    // Preview (3) = future → gray
    expect(circles[3].className).toContain("bg-gray-200");
  });

  it("shows checkmark SVG for completed steps", () => {
    const { container } = render(<Stepper currentStep="preview" />);
    // Upload, Scanning, Todos are completed — should have SVG checkmarks
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(3);
  });

  it("shows green connector before current step and gray after", () => {
    const { container } = render(<Stepper currentStep="todos" />);
    const connectors = container.querySelectorAll(".h-0\\.5");
    // Before current (upload→scanning, scanning→todos) = green
    expect(connectors[0].className).toContain("bg-green-500");
    expect(connectors[1].className).toContain("bg-green-500");
    // After current (todos→preview, etc.) = gray
    expect(connectors[2].className).toContain("bg-gray-200");
  });

  it("accepts custom steps prop", () => {
    const customSteps = [
      { key: "step1", label: "Alpha" },
      { key: "step2", label: "Beta" },
      { key: "step3", label: "Gamma" },
    ];
    render(<Stepper currentStep="step2" steps={customSteps} />);
    expect(screen.getByText("Alpha")).toBeDefined();
    expect(screen.getByText("Beta")).toBeDefined();
    expect(screen.getByText("Gamma")).toBeDefined();
    expect(screen.queryByText("Upload")).toBeNull();
  });
});
