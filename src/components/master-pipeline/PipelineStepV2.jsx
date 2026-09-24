import React from "react";
import { Link } from "react-router-dom";
import { Check, Lock, ChevronRight, Lightbulb, ExternalLink } from "lucide-react";

export default function PipelineStep({ step, intelligence, state, onAction, isActive, isComplete, isLocked, stepNum }) {
  if (isLocked) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-stone-50 opacity-50 p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-stone-200 flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4 text-stone-400" />
        </div>
        <div>
          <span className="text-xs font-bold text-stone-400">Step {stepNum}</span>
          <h3 className="text-base font-bold text-stone-400">{step.title}</h3>
          <p className="text-sm text-stone-300">Complete previous steps to unlock</p>
        </div>
      </div>
    );
  }

  // Find relevant intelligence for this step
  const relevantIntel = intelligence.filter((i) =>
    step.intelCategories?.some((cat) => i.category === cat || i.tags?.some((t) => t.toLowerCase().includes(cat.toLowerCase())))
  );

  // System recommendation based on intelligence
  const recommendation = step.recommend
    ? step.recommend(state, relevantIntel)
    : null;

  return (
    <div className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
      isActive ? "border-amber-400 bg-white shadow-lg shadow-amber-500/10" : isComplete ? "border-green-300 bg-green-50/30" : "border-stone-200 bg-white"
    }`}>
      {/* Step header */}
      <div className="flex items-center gap-4 p-5 border-b border-stone-100">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
          isComplete ? "bg-green-500 text-white" : isActive ? "bg-amber-500 text-stone-950" : "bg-stone-200 text-stone-500"
        }`}>
          {isComplete ? <Check className="w-5 h-5" /> : stepNum}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider text-stone-400 uppercase">Step {stepNum}</span>
            {step.phase && <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">{step.phase}</span>}
          </div>
          <h3 className="text-base font-bold text-stone-900">{step.title}</h3>
          <p className="text-sm text-stone-500">{step.description}</p>
        </div>
        {step.icon && <step.icon className="w-6 h-6 text-stone-300 shrink-0" />}
      </div>

      {/* Intelligence recommendation */}
      {isActive && recommendation && (
        <div className="mx-5 mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-2.5">
            <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-amber-700 uppercase tracking-wide">System Recommends</div>
              <p className="text-sm text-amber-900 mt-1">{recommendation.text}</p>
              {recommendation.reason && (
                <p className="text-xs text-amber-700 mt-1.5 italic">Based on: {recommendation.reason}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Intelligence context */}
      {isActive && relevantIntel.length > 0 && (
        <div className="mx-5 mt-3">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">
            Uploaded Intelligence ({relevantIntel.length} sources)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {relevantIntel.slice(0, 6).map((intel) => (
              <span key={intel.id} className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 border border-blue-200" title={intel.content?.substring(0, 100)}>
                {intel.title}
              </span>
            ))}
            {relevantIntel.length > 6 && (
              <span className="text-xs px-2 py-1 rounded bg-stone-100 text-stone-500">+{relevantIntel.length - 6} more</span>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {isActive && (
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {step.actions(state, relevantIntel).map((action) => {
            const selected = state[`step${stepNum}`]?.id === action.id;
            return (
              <button
                key={action.id}
                onClick={() => onAction(stepNum, action)}
                className={`group text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  selected ? "border-amber-400 bg-amber-50 ring-2 ring-amber-400/20" : "border-stone-200 bg-white hover:border-amber-300 hover:bg-amber-50/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {action.icon && (
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition ${
                      selected ? "bg-amber-500 text-stone-950" : "bg-stone-100 text-stone-500 group-hover:bg-amber-100 group-hover:text-amber-600"
                    }`}>
                      <action.icon className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-bold ${selected ? "text-amber-900" : "text-stone-800"}`}>{action.label}</div>
                    {action.desc && <div className="text-xs text-stone-500 mt-0.5">{action.desc}</div>}
                    {action.tools && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {action.tools.map((t) => (
                          <span key={t} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {selected && <Check className="w-4 h-4 text-amber-500 shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Tool links */}
      {isActive && step.tools && step.tools.length > 0 && (
        <div className="px-5 pb-5">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">Launch Tools</div>
          <div className="flex flex-wrap gap-2">
            {step.tools.map((t) => (
              <Link
                key={t.path}
                to={t.path}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-stone-900 text-white hover:bg-amber-500 hover:text-stone-950 transition"
              >
                {t.label}
                <ExternalLink className="w-3 h-3" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Completed summary */}
      {isComplete && state[`step${stepNum}`] && (
        <div className="px-5 py-3 bg-green-50/50 flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600 shrink-0" />
          <span className="text-sm text-green-700 font-medium">{state[`step${stepNum}`].label}</span>
        </div>
      )}
    </div>
  );
}