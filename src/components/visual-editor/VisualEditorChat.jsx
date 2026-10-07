import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import EditorMessages from "@/components/visual-editor/EditorMessages";
import EditorComposer from "@/components/visual-editor/EditorComposer";

export default function VisualEditorChat({ pageId, onPageBuilt }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;
    const history = messages.slice(-8).map(({ role, content }) => ({ role, content }));
    setSending(true);
    setError("");
    setInput("");
    setMessages(previous => [...previous, { role: "user", content }]);
    try {
      const { data } = await base44.functions.invoke("visualEditorBuild", { message: content, page_id: pageId, history });
      if (!data?.ok) throw new Error(data?.error || "The page could not be saved.");
      if (data.page) onPageBuilt(data.page);
      setMessages(previous => [...previous, { role: "assistant", content: data.message, savedPage: data.page }]);
    } catch (failure) {
      setError(failure.response?.data?.error || failure.message);
      setInput(content);
    } finally { setSending(false); }
  };
  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <header className="border-b border-border px-4 py-3 shrink-0">
        <h2 className="text-sm font-heading font-semibold">AI Builder</h2>
        <p className="mt-1 text-[10px] text-muted-foreground">Vercel AI Gateway · Connected to canvas</p>
      </header>
      {error && <div role="alert" className="m-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">{error}<button onClick={() => setError("")} aria-label="Dismiss error" className="ml-2">×</button></div>}
      <EditorMessages messages={messages} sending={sending} />
      <EditorComposer input={input} onChange={setInput} onSend={send} sending={sending} />
    </div>
  );
}