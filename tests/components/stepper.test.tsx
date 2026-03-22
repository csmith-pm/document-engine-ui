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
});
