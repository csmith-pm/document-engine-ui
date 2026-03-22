import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// We test just the TenantConfig + nav, not the full RootLayout (html/body can't nest)
// Import the module to get the default export
import RootLayout from "../../src/app/layout";

describe("RootLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Document Engine link", () => {
    // RootLayout wraps children in html/body which can cause issues in tests
    // We'll test the exported function directly
    const { container } = render(
      <RootLayout>
        <div>Child content</div>
      </RootLayout>
    );
    const link = container.querySelector('a[href="/reports"]');
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe("Document Engine");
  });

  it("renders tenant config input with default value", () => {
    render(
      <RootLayout>
        <div />
      </RootLayout>
    );
    const input = document.querySelector("#tenant-input") as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.defaultValue).toBe("default");
  });

  it("renders children", () => {
    render(
      <RootLayout>
        <div data-testid="child">Hello</div>
      </RootLayout>
    );
    expect(screen.getByTestId("child")).toBeDefined();
    expect(screen.getByText("Hello")).toBeDefined();
  });

  it("calls localStorage.setItem on tenant input change", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    render(
      <RootLayout>
        <div />
      </RootLayout>
    );
    const input = document.querySelector("#tenant-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "my-tenant" } });
    expect(setItemSpy).toHaveBeenCalledWith("tenantId", "my-tenant");
    setItemSpy.mockRestore();
  });
});
