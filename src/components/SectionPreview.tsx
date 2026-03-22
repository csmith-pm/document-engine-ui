"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ChartConfig, TableRow } from "@/lib/types";

const CHART_COLORS = [
  "#1a365d",
  "#3182ce",
  "#38a169",
  "#d69e2e",
  "#e53e3e",
  "#805ad5",
  "#dd6b20",
  "#319795",
];

function ChartPreview({ config }: { config: ChartConfig }) {
  const colors = config.colors ?? CHART_COLORS;
  const formatValue = (v: unknown) =>
    typeof v === "number" ? `$${v.toLocaleString()}` : String(v ?? "");

  if (config.type === "pie") {
    const valueKey = config.dataKeys[0] ?? "value";
    return (
      <div className="my-4">
        <h4 className="text-sm font-medium text-gray-700 text-center mb-2">
          {config.title}
        </h4>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={config.data}
              dataKey={valueKey}
              nameKey={config.categoryKey}
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={({ name, percent }: { name?: string; percent?: number }) =>
                `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`
              }
            >
              {config.data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={formatValue} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (config.type === "line") {
    return (
      <div className="my-4">
        <h4 className="text-sm font-medium text-gray-700 text-center mb-2">
          {config.title}
        </h4>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={config.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.categoryKey} />
            <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
            <Tooltip formatter={formatValue} />
            <Legend />
            {config.dataKeys.map((key, i) => (
              <Line
                key={key}
                dataKey={key}
                stroke={colors[i % colors.length]}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="my-4">
      <h4 className="text-sm font-medium text-gray-700 text-center mb-2">
        {config.title}
      </h4>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={config.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={config.categoryKey} />
          <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
          <Tooltip formatter={formatValue} />
          <Legend />
          {config.dataKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[i % colors.length]}
              stackId={config.type === "stacked-bar" ? "stack" : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SectionPreview({
  section,
}: {
  section: {
    title: string;
    narrativeContent: string | null;
    tableData: TableRow[] | null;
    chartConfigs: ChartConfig[] | null;
  };
}) {
  const paragraphs = (section.narrativeContent ?? "")
    .split(/\n\n+/)
    .filter((p) => p.trim().length > 0);

  const tableRows = (section.tableData ?? []) as TableRow[];
  const charts = (section.chartConfigs ?? []) as ChartConfig[];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 border-b-2 border-blue-600 pb-2">
        {section.title}
      </h2>

      {paragraphs.map((p, i) => (
        <p key={i} className="text-sm text-gray-700 leading-relaxed">
          {p}
        </p>
      ))}

      {tableRows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              {tableRows
                .filter((r) => r.header)
                .map((row, ri) => (
                  <tr key={ri} className="bg-gray-800">
                    {row.cells.map((cell, ci) => (
                      <th
                        key={ci}
                        scope="col"
                        className={`px-3 py-2 text-white font-medium ${ci > 0 ? "text-right" : "text-left"}`}
                      >
                        {cell}
                      </th>
                    ))}
                  </tr>
                ))}
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tableRows
                .filter((r) => !r.header)
                .map((row, ri) => (
                  <tr
                    key={ri}
                    className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    {row.cells.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`px-3 py-2 ${ci > 0 ? "text-right" : "text-left"}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {charts.map((chart, i) => (
        <ChartPreview key={i} config={chart} />
      ))}
    </div>
  );
}
