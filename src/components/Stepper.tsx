"use client";

export interface Step {
  key: string;
  label: string;
}

const DEFAULT_STEPS: Step[] = [
  { key: "upload", label: "Upload" },
  { key: "scanning", label: "Scanning" },
  { key: "todos", label: "Todos" },
  { key: "preview", label: "Preview" },
  { key: "review", label: "Review" },
  { key: "download", label: "Download" },
];

export function Stepper({
  currentStep,
  steps = DEFAULT_STEPS,
  iteration,
  maxIterations,
}: {
  currentStep: string;
  steps?: Step[];
  iteration?: number;
  maxIterations?: number;
}) {
  const currentIdx = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => {
          const isActive = step.key === currentStep;
          const isCompleted = i < currentIdx;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`mt-1 text-xs ${
                    isActive ? "text-blue-600 font-medium" : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    i < currentIdx ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      {iteration != null && maxIterations != null && (
        <p className="text-center text-sm text-gray-500 mt-2">
          Scan {iteration} of {maxIterations}
        </p>
      )}
    </div>
  );
}
