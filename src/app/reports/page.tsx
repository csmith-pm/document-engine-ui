"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { listReports, deleteReport } from "@/lib/api-client";
import { StatusBadge } from "@/components/StatusBadge";
import { DocTypeBadge } from "@/components/DocTypeBadge";
import type { Document } from "@/lib/types";

export default function ReportsListPage() {
  const [reports, setReports] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await listReports();
      setReports(data);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <Link
          href="/reports/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
        >
          New Report
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : reports.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-4">No reports yet</p>
          <Link
            href="/reports/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
          >
            Create your first report
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Year
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Scan
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/reports/${report.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {report.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <DocTypeBadge docType={report.docType} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    FY{report.fiscalYear}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={report.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {report.currentIteration + 1}/{report.maxIterations}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(report.id, report.title);
                      }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
