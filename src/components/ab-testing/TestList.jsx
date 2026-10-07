import React from "react";
import { FlaskConical, Play, Pause, Square, Trash2, Plus } from "lucide-react";

const STATUS_STYLES = {
  draft: "bg-stone-100 text-stone-600",
  running: "bg-green-100 text-green-700",
  paused: "bg-amber-100 text-amber-700",
  completed: "bg-blue-100 text-blue-700",
};

export default function TestList({ tests, onSelect, onStatusChange, onDelete, onCreate }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-stone-900">All Tests</h2>
        <button
          onClick={onCreate}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-stone-950 hover:bg-amber-400 transition"
        >
          <Plus className="h-4 w-4" /> New Test
        </button>
      </div>

      {tests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 p-12 text-center">
          <FlaskConical className="h-10 w-10 text-stone-300 mx-auto mb-3" />
          <p className="text-sm text-stone-500">No A/B tests yet. Create one to start optimizing conversions.</p>
        </div>
      ) : (
        tests.map((test) => {
          const crA = test.impressions_a > 0 ? (test.conversions_a / test.impressions_a * 100).toFixed(1) : "0.0";
          const crB = test.impressions_b > 0 ? (test.conversions_b / test.impressions_b * 100).toFixed(1) : "0.0";
          const totalImpressions = (test.impressions_a || 0) + (test.impressions_b || 0);
          return (
            <div
              key={test.id}
              className="rounded-xl border border-stone-200 bg-white p-4 hover:border-amber-400 transition cursor-pointer"
              onClick={() => onSelect(test)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-stone-900 truncate">{test.name}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[test.status] || STATUS_STYLES.draft}`}>
                      {test.status}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    <span className="font-mono">{test.page_path}</span> · {totalImpressions} impressions · converts on <span className="font-mono">{test.conversion_event}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {test.status !== "running" && (
                    <button onClick={() => onStatusChange(test.id, "running")} className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition" title="Start">
                      <Play className="h-4 w-4" />
                    </button>
                  )}
                  {test.status === "running" && (
                    <button onClick={() => onStatusChange(test.id, "paused")} className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 transition" title="Pause">
                      <Pause className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => onStatusChange(test.id, "completed")} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition" title="Complete">
                    <Square className="h-4 w-4" />
                  </button>
                  <button onClick={() => onDelete(test.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3">
                <div className="rounded-lg bg-stone-50 p-2 text-center">
                  <div className="text-xs text-stone-500">Variant A CR</div>
                  <div className="text-sm font-black text-stone-900">{crA}%</div>
                  <div className="text-xs text-stone-400">{test.impressions_a || 0} views</div>
                </div>
                <div className="rounded-lg bg-stone-50 p-2 text-center">
                  <div className="text-xs text-stone-500">Variant B CR</div>
                  <div className="text-sm font-black text-stone-900">{crB}%</div>
                  <div className="text-xs text-stone-400">{test.impressions_b || 0} views</div>
                </div>
                <div className="rounded-lg bg-stone-50 p-2 text-center">
                  <div className="text-xs text-stone-500">Split</div>
                  <div className="text-sm font-black text-stone-900">{test.traffic_split}/{100 - test.traffic_split}</div>
                  <div className="text-xs text-stone-400">A / B</div>
                </div>
                <div className="rounded-lg bg-stone-50 p-2 text-center">
                  <div className="text-xs text-stone-500">Winner</div>
                  <div className="text-sm font-black text-stone-900">
                    {test.winner === "a" ? "A" : test.winner === "b" ? "B" : "—"}
                  </div>
                  <div className="text-xs text-stone-400">{test.winner !== "none" ? test.winner : "testing"}</div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}