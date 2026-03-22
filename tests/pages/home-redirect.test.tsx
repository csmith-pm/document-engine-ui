import { describe, it, expect, vi } from "vitest";
import { redirect } from "next/navigation";
import Home from "../../src/app/page";

describe("Home page", () => {
  it("redirects to /reports", () => {
    Home();
    expect(redirect).toHaveBeenCalledWith("/reports");
  });
});
