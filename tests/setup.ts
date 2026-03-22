import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import React from "react";

afterEach(() => {
  cleanup();
});

// jsdom doesn't implement scrollTo
Element.prototype.scrollTo = vi.fn();

// Mock recharts — jsdom cannot render SVG charts
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "responsive-container" }, children),
  BarChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "bar-chart" }, children),
  PieChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "pie-chart" }, children),
  LineChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "line-chart" }, children),
  Bar: () => null,
  Pie: () => null,
  Cell: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({}),
  usePathname: () => "/",
  redirect: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) =>
    React.createElement("a", { href, ...rest }, children),
}));
