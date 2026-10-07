import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Paperclip, Bot, Zap, Eye } from "lucide-react";
import BuilderChat from "@/components/codestudio/BuilderChat";
import VisualPageEditor from "@/components/visual-editor/VisualPageEditor";
import ErrorBoundary from "@/components/codestudio/ErrorBoundary";

export default function VisualEditor() {
  const [chatWidth, setChatWidth] = useState(38);
  const [resizing, setResizing] = useState(false);

  const startResize = (e) => {
    e.preventDefault();
    setResizing(true);
    const startX = e.clientX;
    const startWidth = chatWidth;
    const container = e.currentTarget.parentElement;
    const containerWidth = container.offsetWidth;

    const onMouseMove = (e) => {
      const delta = ((e.clientX - startX) / containerWidth) * 100;
      const newWidth = Math.min(Math.max(startWidth + delta, 25), 55);
      setChatWidth(newWidth);
    };
    const onMouseUp = () => {
      setResizing(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 128px)" }}>
      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-stone-200 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center shrink-0">
          <Eye className="h-4 w-4 text-stone-950" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-bold text-stone-900">Visual Editor</h1>
          <p className="text-[10px] text-stone-400">Chat with the AI on the left, edit the page visually on the right</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
          <Zap className="h-3 w-3" /> Direct Edit Enabled
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Chat panel — left */}
        <div style={{ width: `${chatWidth}%` }} className="border-r border-stone-200 min-w-0 shrink-0">
          <ErrorBoundary>
            <BuilderChat />
          </ErrorBoundary>
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={startResize}
          className={`w-1 bg-stone-200 hover:bg-amber-400 cursor-col-resize shrink-0 transition-colors ${
            resizing ? "bg-amber-400" : ""
          }`}
        />

        {/* Visual editor panel — right */}
        <div className="flex-1 min-w-0 overflow-hidden relative">
          <ErrorBoundary>
            <VisualPageEditor />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}