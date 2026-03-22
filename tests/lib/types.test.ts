import { describe, it, expect } from "vitest";
import { DOC_TYPE_OPTIONS } from "../../src/lib/types";

describe("DOC_TYPE_OPTIONS", () => {
  it("has exactly 2 entries", () => {
    expect(DOC_TYPE_OPTIONS).toHaveLength(2);
  });

  it("first entry is budget_book", () => {
    expect(DOC_TYPE_OPTIONS[0].value).toBe("budget_book");
    expect(DOC_TYPE_OPTIONS[0].label).toBe("Budget Book");
  });

  it("second entry is pafr", () => {
    expect(DOC_TYPE_OPTIONS[1].value).toBe("pafr");
    expect(DOC_TYPE_OPTIONS[1].label).toBe("Popular Annual Financial Report");
  });

  it("each entry has non-empty value, label, and description", () => {
    for (const option of DOC_TYPE_OPTIONS) {
      expect(option.value.length).toBeGreaterThan(0);
      expect(option.label.length).toBeGreaterThan(0);
      expect(option.description.length).toBeGreaterThan(0);
    }
  });
});
