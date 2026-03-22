"use client";

import { DOC_TYPE_OPTIONS } from "@/lib/types";

export function DocTypeBadge({ docType }: { docType: string }) {
  const option = DOC_TYPE_OPTIONS.find((o) => o.value === docType);
  const label = option?.label ?? docType.replace(/_/g, " ");

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
      {label}
    </span>
  );
}
