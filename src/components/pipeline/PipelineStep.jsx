import React from "react";
import { Check, Lock, ChevronRight } from "lucide-react";

export default function PipelineStep({ step, state, onAction, isActive, isComplete, isLocked }) {
  return (
    <div
      className={`rounded-2xl border transition-all duration-300 ${
        isLocked
          ? "border-stone-200 bg-stone-50 opacity-60"
          : isActive
          ? "border-amber-400 bg-white shadow-lg shadow-amber-500/10"
          : isComplete
          ? "border-green-300 bg-green-50/50"
          : "border-stone-200 bg-white"
      }`}
    >
      {/* Step header */}
      <div className="flex items-center gap-4 p-5 border-b border-stone-100">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition ${
            isLocked
              ? "bg-stone-200 text-stone-400"
              : isComplete
              ? "bg-green-500 text-white"
              : isActive
              ? "bg-amber-500 text-stone-950"
              : "bg-stone-200 text-stone-500"
          }`}
        >
          {isComplete ? <Check className="w-5 h-5" /> : isLocked ? <Lock className="w-4 h-4" /> : step.id}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider text-stone-400 uppercase">Step {step.id}</span>
            {isComplete && state[`step${step.id}`] && (
              <span className="text-xs font-medium text-green-600 truncate">
                → {state[`step${step.id}`].label}
              </span>
            )}
          </div>
          <h3 className={`text-base font-bold ${isLocked ? "text-stone-400" : "text-stone-900"}`}>
            {step.title}
          </h3>
          <p className={`text-sm ${isLocked ? "text-stone-300" : "text-stone-500"}`}>
            {step.subtitle}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      {isActive && (
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {step.actions(state).map((action) => {
            const selected = state[`step${step.id}`]?.id === action.id;
            return (
              <button
                key={action.id}
                onClick={() => onAction(step.id, action)}
                className={`group text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  selected
                    ? "border-amber-400 bg-amber-50 ring-2 ring-amber-400/20"
                    : "border-stone-200 bg-white hover:border-amber-300 hover:bg-amber-50/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition ${
                      selected ? "bg-amber-500 text-stone-950" : "bg-stone-100 text-stone-500 group-hover:bg-amber-100 group-hover:text-amber-600"
                    }`}
                  >
                    {action.icon ? <action.icon className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className={`text-sm font-bold ${selected ? "text-amber-900" : "text-stone-800"}`}>
                      {action.label}
                    </div>
                    {action.desc && (
                      <div className="text-xs text-stone-500 mt-0.5">{action.desc}</div>
                    )}
                    {action.enables && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {action.enables.map((e) => (
                          <span key={e} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">
                            {e}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {selected && <Check className="w-4 h-4 text-amber-500 shrink-0 ml-auto" />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Locked message */}
      {isLocked && (
        <div className="p-5 text-center">
          <p className="text-xs text-stone-400">Complete previous steps to unlock</p>
        </div>
      )}
    </div>
  );
}