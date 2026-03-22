"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createReport, uploadDataFile, uploadPriorDocument, startGeneration } from "@/lib/api-client";
import { FileDropZone } from "@/components/FileDropZone";
import { DOC_TYPE_OPTIONS } from "@/lib/types";

type WizardStep = "type" | "data" | "prior" | "confirm";

export default function NewReportPage() {
  const router = useRouter();

  const [step, setStep] = useState<WizardStep>("type");
  const [docType, setDocType] = useState("budget_book");
  const [title, setTitle] = useState("");
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [priorFile, setPriorFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedType = DOC_TYPE_OPTIONS.find((o) => o.value === docType);

  const handleCreateAndUploadData = async () => {
    if (!title.trim() || !dataFile) return;
    setUploading(true);
    setError(null);

    try {
      const doc = await createReport({
        docType,
        title: title.trim(),
        fiscalYear,
        dataSource: "upload",
        maxIterations: 5,
      });
      setDocumentId(doc.id);
      await uploadDataFile(doc.id, dataFile);
      setStep("prior");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create report");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadPrior = async () => {
    if (!documentId || !priorFile) return;
    setUploading(true);
    setError(null);

    try {
      await uploadPriorDocument(documentId, priorFile);
      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSkipPrior = () => {
    setStep("confirm");
  };

  const handleStartGeneration = async () => {
    if (!documentId) return;
    setUploading(true);
    setError(null);

    try {
      await startGeneration(documentId);
      router.push(`/reports/${documentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Report</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 text-sm">
        {(["type", "data", "prior", "confirm"] as WizardStep[]).map(
          (s, i) => (
            <div key={s} className="flex items-center">
              {i > 0 && <div className="w-8 h-0.5 bg-gray-200 mx-1" />}
              <span
                className={`px-2 py-1 rounded ${
                  step === s
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "text-gray-400"
                }`}
              >
                {i + 1}. {s === "type" ? "Type" : s === "data" ? "Data" : s === "prior" ? "Prior Year" : "Confirm"}
              </span>
            </div>
          )
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step 1: Report type & basics */}
      {step === "type" && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {DOC_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDocType(option.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    docType === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-medium text-gray-900">{option.label}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`FY${fiscalYear} ${selectedType?.label ?? "Report"}`}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fiscal Year
            </label>
            <input
              type="number"
              value={fiscalYear}
              onChange={(e) => setFiscalYear(parseInt(e.target.value, 10))}
              min={2000}
              max={2100}
              className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => setStep("data")}
            disabled={!title.trim()}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            Next: Upload Data
          </button>
        </div>
      )}

      {/* Step 2: Upload data file */}
      {step === "data" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Upload Data File
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Upload your financial data (Excel, CSV) for the{" "}
              {selectedType?.label ?? "report"}.
            </p>
            {dataFile ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-sm text-green-800">{dataFile.name}</span>
                <button
                  onClick={() => setDataFile(null)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Change
                </button>
              </div>
            ) : (
              <FileDropZone
                accept=".xlsx,.xls,.csv"
                label="Drop your budget or financial data file here"
                onFile={setDataFile}
              />
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("type")}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Back
            </button>
            <button
              onClick={handleCreateAndUploadData}
              disabled={!dataFile || uploading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {uploading ? "Uploading..." : "Next: Prior Year Document"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Prior year PDF (optional) */}
      {step === "prior" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Upload Prior Year Document (Optional)
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Upload a prior year PDF for style, format, and section reference.
              This helps the agents match your established look and feel.
            </p>
            {priorFile ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-sm text-green-800">
                  {priorFile.name}
                </span>
                <button
                  onClick={() => setPriorFile(null)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Change
                </button>
              </div>
            ) : (
              <FileDropZone
                accept=".pdf"
                label="Drop your prior year PDF here"
                onFile={setPriorFile}
              />
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSkipPrior}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Skip
            </button>
            <button
              onClick={handleUploadPrior}
              disabled={!priorFile || uploading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {uploading ? "Uploading..." : "Next: Review & Start"}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm & generate */}
      {step === "confirm" && (
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Review & Start
          </h2>

          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
            <div className="p-4 flex justify-between">
              <span className="text-sm text-gray-500">Report Type</span>
              <span className="text-sm font-medium text-gray-900">
                {selectedType?.label}
              </span>
            </div>
            <div className="p-4 flex justify-between">
              <span className="text-sm text-gray-500">Title</span>
              <span className="text-sm font-medium text-gray-900">
                {title}
              </span>
            </div>
            <div className="p-4 flex justify-between">
              <span className="text-sm text-gray-500">Fiscal Year</span>
              <span className="text-sm font-medium text-gray-900">
                {fiscalYear}
              </span>
            </div>
            <div className="p-4 flex justify-between">
              <span className="text-sm text-gray-500">Data File</span>
              <span className="text-sm font-medium text-gray-900">
                {dataFile?.name ?? "None"}
              </span>
            </div>
            <div className="p-4 flex justify-between">
              <span className="text-sm text-gray-500">Prior Year PDF</span>
              <span className="text-sm font-medium text-gray-900">
                {priorFile?.name ?? "Skipped"}
              </span>
            </div>
            <div className="p-4 flex justify-between">
              <span className="text-sm text-gray-500">Max Iterations</span>
              <span className="text-sm font-medium text-gray-900">5</span>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            The agents will analyze your data and produce a first scan. You can
            iterate up to 5 times or generate the final PDF at any point.
          </p>

          <button
            onClick={handleStartGeneration}
            disabled={uploading}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-lg"
          >
            {uploading ? "Starting..." : "Start First Scan"}
          </button>
        </div>
      )}
    </div>
  );
}
