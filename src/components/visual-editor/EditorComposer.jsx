import React from "react";
import { Send, Loader2 } from "lucide-react";

export default function EditorComposer({ input, onChange, onSend, sending }) {
  return (
    <form onSubmit={event => { event.preventDefault(); onSend(); }} className="border-t border-border bg-card p-3 shrink-0">
      <div className="flex items-end gap-2">
        <textarea aria-label="Describe your page or changes" value={input} onChange={event => onChange(event.target.value)}
          onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); onSend(); } }}
          placeholder="Build a page or change this one…" rows={3}
          className="min-w-0 flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        <button type="submit" aria-label="Build page" disabled={sending || !input.trim()}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ring">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">Changes save as drafts. External websites are not automatically published.</p>
    </form>
  );
}