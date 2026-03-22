"use client";

import { useState, useCallback } from "react";
import { uploadTodoFile } from "@/lib/api-client";

export function TodoFileUploader({
  todoId,
  onUploaded,
  onCancel,
}: {
  todoId: string;
  onUploaded: (s3Key: string, fileName: string) => void;
  onCancel: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const result = await uploadTodoFile(todoId, file);
        onUploaded(result.s3Key, file.name);
      } catch (err) {
        console.error("Upload failed:", err);
        alert("File upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [todoId, onUploaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
        dragActive
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 hover:border-gray-400"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
    >
      {uploading ? (
        <p className="text-gray-500 text-sm">Uploading...</p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            Drop a file here or browse (PDF, CSV, XLSX, images)
          </p>
          <div className="flex justify-center gap-2">
            <label className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
              Browse
              <input
                type="file"
                accept=".pdf,.csv,.xlsx,.xls,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleChange}
              />
            </label>
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
