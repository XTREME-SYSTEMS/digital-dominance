import React, { useState } from "react";
import { Monitor, Tablet, Smartphone, ExternalLink, Eye } from "lucide-react";

export default function SandboxPreview({ url }) {
  const [device, setDevice] = useState("desktop");

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-stone-50 rounded-xl border border-dashed border-stone-300 gap-2">
        <Eye className="h-8 w-8 text-stone-300" />
        <p className="text-xs text-stone-400 font-medium">Sandbox preview appears here</p>
        <p className="text-[10px] text-stone-400 max-w-[200px] text-center">
          Once GPT builds a website, the live preview will render here with desktop and mobile views.
        </p>
      </div>
    );
  }

  const fullUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;
  const widths = { desktop: "100%", tablet: "768px", mobile: "375px" };

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white p-0.5">
          {[
            { id: "desktop", icon: Monitor },
            { id: "tablet", icon: Tablet },
            { id: "mobile", icon: Smartphone },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => setDevice(d.id)}
              className={`flex items-center justify-center rounded-md p-1.5 transition ${
                device === d.id ? "bg-amber-500 text-stone-900" : "text-stone-400 hover:text-stone-600"
              }`}
            >
              <d.icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-stone-600 hover:border-amber-300 hover:text-amber-700"
        >
          <ExternalLink className="h-3 w-3" /> Open
        </a>
      </div>
      <div className="flex-1 overflow-hidden rounded-xl border border-stone-200 bg-white">
        <iframe
          src={fullUrl}
          title="Sandbox Preview"
          className="h-full w-full border-0"
          style={{ maxWidth: widths[device], margin: "0 auto" }}
        />
      </div>
    </div>
  );
}