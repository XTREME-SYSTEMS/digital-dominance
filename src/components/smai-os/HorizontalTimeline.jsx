import React from "react";
import { Check } from "lucide-react";

// Horizontal timeline that sits at the top of the client portal.
// Shows all onboarding steps in a horizontal row with visual state indicators.
export default function HorizontalTimeline({ steps, currentStep, onStepClick }) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center min-w-max gap-0 px-2">
        {steps.map((step, idx) => {
          const isCompleted = step.status === "completed";
          const isActive = step.step_number === currentStep;
          const isLocked = step.status === "locked";
          const isLast = idx === steps.length - 1;

          return (
            <React.Fragment key={step.step_key}>
              <button
                onClick={() => !isLocked && onStepClick?.(step.step_number)}
                disabled={isLocked}
                className={`flex flex-col items-center gap-1.5 shrink-0 ${isLocked ? "cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    isCompleted
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : isActive
                      ? "bg-[#00D4FF] border-[#00D4FF] text-black shadow-[0_0_20px_rgba(0,212,255,0.5)]"
                      : isLocked
                      ? "bg-stone-800 border-stone-700 text-stone-500"
                      : "bg-stone-800 border-stone-600 text-stone-300"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-bold">{step.step_number}</span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${
                    isActive ? "text-[#00D4FF]" : isCompleted ? "text-emerald-400" : isLocked ? "text-stone-600" : "text-stone-400"
                  }`}
                >
                  {step.title}
                </span>
              </button>
              {!isLast && (
                <div
                  className={`h-0.5 w-8 sm:w-12 mt-[-20px] shrink-0 ${
                    isCompleted ? "bg-emerald-500" : "bg-stone-700"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}