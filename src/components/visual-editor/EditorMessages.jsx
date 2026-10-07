import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function EditorMessages({ messages, sending }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages, sending]);
  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4" aria-live="polite">
      {!messages.length && !sending && <div className="flex h-full flex-col justify-center text-center gap-2">
        <h2 className="font-heading font-semibold text-foreground">What would you like to build?</h2>
        <p className="text-xs text-muted-foreground">Describe a page or ask for changes. I’ll save them directly to the canvas on the right.</p>
      </div>}
      {messages.map((message, index) => <div key={index} className={`mb-4 ${message.role === "user" ? "ml-5" : "mr-2"}`}>
        <p className="mb-1 text-[10px] text-muted-foreground">{message.role === "user" ? "You" : "Builder"}</p>
        <div className={`rounded-lg p-3 text-sm break-words ${message.role === "user" ? "bg-secondary text-secondary-foreground" : "bg-card border border-border text-card-foreground"}`}>
          {message.role === "user" ? <p className="whitespace-pre-wrap">{message.content}</p> : <ReactMarkdown className="prose prose-sm max-w-none prose-p:my-1">{message.content}</ReactMarkdown>}
          {message.savedPage && <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5" />Saved to canvas · {message.savedPage.sections.length} sections</p>}
        </div>
      </div>)}
      {sending && <p className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Building and saving your page…</p>}
      <div ref={endRef} />
    </div>
  );
}