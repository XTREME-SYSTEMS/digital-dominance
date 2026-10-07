import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { FlaskConical, Loader2 } from "lucide-react";
import TestList from "@/components/ab-testing/TestList";
import TestBuilder from "@/components/ab-testing/TestBuilder";
import TestResults from "@/components/ab-testing/TestResults";

export default function ABTesting() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [selectedTest, setSelectedTest] = useState(null);

  const loadTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("abTestEngine", { action: "list" });
      const data = res.data || res;
      setTests(data.tests || []);
    } catch (e) {
      console.error("Failed to load tests:", e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadTests(); }, [loadTests]);

  const handleCreate = async (formData) => {
    try {
      await base44.functions.invoke("abTestEngine", { action: "create", ...formData });
      setView("list");
      loadTests();
    } catch (e) {
      console.error("Failed to create test:", e.message);
    }
  };

  const handleStatusChange = async (testId, status) => {
    try {
      await base44.functions.invoke("abTestEngine", { action: "update", test_id: testId, status });
      loadTests();
    } catch (e) {
      console.error("Failed to update test:", e.message);
    }
  };

  const handleDelete = async (testId) => {
    if (!confirm("Delete this test? This cannot be undone.")) return;
    try {
      await base44.functions.invoke("abTestEngine", { action: "delete", test_id: testId });
      loadTests();
    } catch (e) {
      console.error("Failed to delete test:", e.message);
    }
  };

  const handleSelect = (test) => {
    setSelectedTest(test);
    setView("results");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center">
          <FlaskConical className="h-6 w-6 text-stone-950" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-stone-900">A/B Website Testing</h1>
          <p className="text-sm text-stone-500">Test headlines, CTAs, and content variants to optimize conversion rates.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-stone-400" /></div>
      ) : view === "create" ? (
        <TestBuilder onSave={handleCreate} onCancel={() => setView("list")} />
      ) : view === "results" && selectedTest ? (
        <TestResults test={selectedTest} onBack={() => { setView("list"); setSelectedTest(null); }} />
      ) : (
        <TestList tests={tests} onSelect={handleSelect} onStatusChange={handleStatusChange} onDelete={handleDelete} onCreate={() => setView("create")} />
      )}
    </div>
  );
}