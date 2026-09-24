import React, { useState, useMemo } from "react";
import {
  Building2, Megaphone, TrendingUp, Settings,
  Users, Code, Mail, Phone, Search, Shield,
  FileText, Calendar, Image, PenTool, BarChart3,
  FolderTree, Clock, Activity, Zap,
  Rocket, Check, RotateCcw, ChevronLeft, Loader2,
} from "lucide-react";
import PipelineStep from "@/components/pipeline/PipelineStep";

// ═══════════════════════════════════════════════════════
// PIPELINE DEFINITION — deterministic, cascading
// Each step's available actions are computed from prior state
// ═══════════════════════════════════════════════════════

const PIPELINE = [
  {
    id: 1,
    title: "Initialize System",
    subtitle: "Choose your workspace foundation — this gates every step below",
    actions: () => [
      { id: "full", label: "Full Workspace OS", desc: "All departments, templates, and automation", icon: Building2, enables: ["Exec", "Eng", "Mktg", "Sales", "Ops"] },
      { id: "marketing", label: "Marketing Focus", desc: "SEO, content, and social media only", icon: Megaphone, enables: ["Mktg", "Content", "SEO"] },
      { id: "sales", label: "Sales Focus", desc: "Lead management and pipeline", icon: TrendingUp, enables: ["Sales", "Leads", "Pipeline"] },
      { id: "custom", label: "Custom Build", desc: "Pick modules individually", icon: Settings, enables: ["All available"] },
    ],
  },
  {
    id: 2,
    title: "Agent Architecture",
    subtitle: "Define your team — options depend on Step 1",
    actions: (s) => {
      const choice = s.step1?.id;
      if (choice === "full") return [
        { id: "exec_full", label: "Executive Team", desc: "CEO, CTO, EA agents", icon: Users },
        { id: "eng_full", label: "Engineering Dept", desc: "Builders, QA, DevOps", icon: Code },
        { id: "mktg_full", label: "Marketing Dept", desc: "SEO, content, social", icon: Megaphone },
        { id: "sales_full", label: "Sales Dept", desc: "Lead gen, follow-up, pipeline", icon: TrendingUp },
        { id: "ops_full", label: "Operations Dept", desc: "Comms, scheduling, monitoring", icon: Activity },
        { id: "sec_full", label: "Security & QA", desc: "Validation, auditing, compliance", icon: Shield },
      ];
      if (choice === "marketing") return [
        { id: "mktg_team", label: "Marketing Team", desc: "Campaign strategy, brand", icon: Megaphone },
        { id: "content_team", label: "Content Team", desc: "Blog, copy, creative", icon: PenTool },
        { id: "seo_team", label: "SEO Team", desc: "Keywords, pages, rankings", icon: Search },
        { id: "social_team", label: "Social Media Team", desc: "Posts, engagement, scheduling", icon: Image },
      ];
      if (choice === "sales") return [
        { id: "lead_team", label: "Lead Generation", desc: "Scraping, enrichment, scoring", icon: Users },
        { id: "pipeline_team", label: "Pipeline Ops", desc: "Follow-up, nurturing, closing", icon: TrendingUp },
        { id: "comms_team", label: "Communications", desc: "SMS, email, voice outreach", icon: Phone },
        { id: "crm_team", label: "CRM Management", desc: "HubSpot sync, data entry", icon: BarChart3 },
      ];
      // custom — all available
      return [
        { id: "exec_custom", label: "Executive Team", desc: "CEO, CTO, EA agents", icon: Users },
        { id: "eng_custom", label: "Engineering Dept", desc: "Builders, QA, DevOps", icon: Code },
        { id: "mktg_custom", label: "Marketing Dept", desc: "SEO, content, social", icon: Megaphone },
        { id: "sales_custom", label: "Sales Dept", desc: "Lead gen, follow-up, pipeline", icon: TrendingUp },
        { id: "ops_custom", label: "Operations Dept", desc: "Comms, scheduling, monitoring", icon: Activity },
        { id: "sec_custom", label: "Security & QA", desc: "Validation, auditing, compliance", icon: Shield },
      ];
    },
  },
  {
    id: 3,
    title: "Template System",
    subtitle: "Choose document templates — filtered by your team selection",
    actions: (s) => {
      const team = s.step2?.id || "";
      const isMarketing = team.includes("mktg") || team.includes("content") || team.includes("seo") || team.includes("social");
      const isSales = team.includes("sales") || team.includes("lead") || team.includes("pipeline") || team.includes("comms") || team.includes("crm");
      const isEng = team.includes("eng");
      const isExec = team.includes("exec");

      const actions = [];
      if (isSales || isExec || team === "") actions.push({ id: "proposals", label: "Proposals", desc: "Client proposal templates", icon: FileText });
      if (isSales || isExec || team === "") actions.push({ id: "invoices", label: "Invoices", desc: "Billing and invoicing", icon: FileText });
      if (isSales || isExec || team === "") actions.push({ id: "onboarding", label: "Onboarding Docs", desc: "Client onboarding packets", icon: FileText });
      if (isMarketing || team === "") actions.push({ id: "content_cal", label: "Content Calendar", desc: "Monthly content schedule", icon: Calendar });
      if (isMarketing || team === "") actions.push({ id: "social_posts", label: "Social Post Templates", desc: "Platform-specific post formats", icon: Image });
      if (isMarketing || team === "") actions.push({ id: "seo_pages", label: "SEO Page Templates", desc: "Location and service pages", icon: Search });
      if (isEng || team === "") actions.push({ id: "sows", label: "Statements of Work", desc: "Technical SOW templates", icon: FileText });
      if (isEng || team === "") actions.push({ id: "tech_specs", label: "Technical Specs", desc: "Architecture and spec docs", icon: Code });
      if (actions.length === 0) actions.push({ id: "generic", label: "Generic Templates", desc: "Basic document set", icon: FileText });
      return actions;
    },
  },
  {
    id: 4,
    title: "Drive Structure",
    subtitle: "Organize your Google Drive — based on your team and templates",
    actions: (s) => {
      const team = s.step2?.id || "";
      const templates = s.step3?.id || "";
      const isMarketing = team.includes("mktg") || team.includes("content") || team.includes("seo") || team.includes("social");
      const isSales = team.includes("sales") || team.includes("lead") || team.includes("pipeline") || team.includes("comms") || team.includes("crm");

      if (isMarketing) return [
        { id: "mktg_drive", label: "Marketing Drive", desc: "Campaigns, Content, Analytics, Social, Assets", icon: FolderTree },
        { id: "mktg_client", label: "Client Campaigns", desc: "Per-client campaign folders", icon: FolderTree },
        { id: "mktg_assets", label: "Asset Library", desc: "Shared creative assets", icon: FolderTree },
      ];
      if (isSales) return [
        { id: "sales_drive", label: "Sales Drive", desc: "Leads, Pipeline, Contracts, Reports", icon: FolderTree },
        { id: "sales_client", label: "Client Folders", desc: "Per-client deal folders", icon: FolderTree },
        { id: "sales_proposals", label: "Proposal Archive", desc: "All sent proposals", icon: FolderTree },
      ];
      return [
        { id: "standard_drive", label: "Standard Structure", desc: "Clients, Projects, Proposals, Invoices, Research, Agents", icon: FolderTree },
        { id: "dept_drive", label: "Department-Based", desc: "Folders organized by department", icon: FolderTree },
        { id: "client_drive", label: "Client-Centric", desc: "Everything organized per client", icon: FolderTree },
      ];
    },
  },
  {
    id: 5,
    title: "Calendar & Automation",
    subtitle: "Set your automation schedule — based on everything above",
    actions: (s) => {
      const team = s.step2?.id || "";
      const isMarketing = team.includes("mktg") || team.includes("content") || team.includes("seo") || team.includes("social");
      const isSales = team.includes("sales") || team.includes("lead") || team.includes("pipeline") || team.includes("comms");

      const actions = [
        { id: "weekly_scan", label: "Weekly Opportunity Scan", desc: "Every Monday at 9 AM", icon: Calendar },
        { id: "daily_engine", label: "Daily Lead Engine", desc: "Every day at 8 AM", icon: Clock },
      ];
      if (isMarketing) actions.push({ id: "social_auto", label: "Social Media Autopilot", desc: "Posts scheduled automatically", icon: Zap });
      if (isMarketing) actions.push({ id: "seo_monitor", label: "SEO Rank Monitor", desc: "Daily ranking checks", icon: Search });
      if (isSales) actions.push({ id: "lead_followup", label: "Lead Follow-Up Automation", desc: "Auto SMS/email sequences", icon: Mail });
      if (isSales) actions.push({ id: "pipeline_sync", label: "Pipeline Sync", desc: "Hourly CRM sync", icon: Activity });
      actions.push({ id: "monthly_review", label: "Monthly System Review", desc: "First of every month", icon: BarChart3 });
      return actions;
    },
  },
  {
    id: 6,
    title: "Launch Pipeline",
    subtitle: "Review your configuration and deploy",
    actions: () => [
      { id: "deploy", label: "Deploy Pipeline", desc: "Create all entities, folders, and schedules", icon: Rocket },
      { id: "save_draft", label: "Save as Draft", desc: "Save configuration without deploying", icon: FileText },
    ],
  },
];

// ═══════════════════════════════════════════════════════

export default function PipelineBuilder() {
  const [state, setState] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);

  const completedSteps = useMemo(() => {
    const completed = {};
    for (let i = 1; i <= 6; i++) {
      completed[i] = !!state[`step${i}`];
    }
    return completed;
  }, [state]);

  const handleAction = (stepId, action) => {
    // Clear all downstream choices when a step changes (cascade reset)
    const newState = {};
    for (let i = 1; i < stepId; i++) newState[`step${i}`] = state[`step${i}`];
    newState[`step${stepId}`] = action;
    setState(newState);

    // Auto-advance to next step
    if (stepId < 6) {
      setTimeout(() => setCurrentStep(stepId + 1), 300);
    }
  };

  const goBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const reset = () => {
    setState({});
    setCurrentStep(1);
    setDeployed(false);
  };

  const handleDeploy = () => {
    setDeploying(true);
    // Simulate deployment (entity creation would go here)
    setTimeout(() => {
      setDeploying(false);
      setDeployed(true);
    }, 2000);
  };

  const allComplete = completedSteps[1] && completedSteps[2] && completedSteps[3] && completedSteps[4] && completedSteps[5];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Pipeline Builder</h1>
        <p className="text-stone-500 mt-1">
          Each step's options are determined by your previous choices. Complete in order — changes cascade downstream.
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {PIPELINE.map((step, i) => (
          <React.Fragment key={step.id}>
            <button
              onClick={() => {
                // Can only navigate to completed or current step
                if (completedSteps[step.id] || step.id === 1 || completedSteps[step.id - 1]) {
                  setCurrentStep(step.id);
                }
              }}
              disabled={!completedSteps[step.id] && step.id !== 1 && !completedSteps[step.id - 1]}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                currentStep === step.id
                  ? "bg-amber-500 text-stone-950"
                  : completedSteps[step.id]
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-stone-100 text-stone-400 cursor-not-allowed"
              }`}
            >
              {completedSteps[step.id] ? <Check className="w-3 h-3" /> : step.id}
              <span className="hidden sm:inline">{step.title}</span>
            </button>
            {i < PIPELINE.length - 1 && <div className={`h-0.5 w-4 ${completedSteps[step.id] ? "bg-green-300" : "bg-stone-200"}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Pipeline steps */}
      <div className="space-y-4">
        {PIPELINE.map((step) => {
          const isActive = currentStep === step.id;
          const isComplete = completedSteps[step.id];
          const isLocked = step.id > 1 && !completedSteps[step.id - 1] && !isActive;
          return (
            <PipelineStep
              key={step.id}
              step={step}
              state={state}
              onAction={handleAction}
              isActive={isActive}
              isComplete={isComplete}
              isLocked={isLocked}
            />
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={goBack}
          disabled={currentStep === 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-stone-500 hover:bg-stone-100 transition"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>

          {allComplete && currentStep === 6 && state.step6?.id === "deploy" && (
            <button
              onClick={handleDeploy}
              disabled={deploying || deployed}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm transition disabled:opacity-50"
            >
              {deploying ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Deploying...</>
              ) : deployed ? (
                <><Check className="w-4 h-4" /> Deployed!</>
              ) : (
                <><Rocket className="w-4 h-4" /> Launch Pipeline</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Summary card (shows when all steps complete) */}
      {allComplete && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6">
          <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide mb-4">Pipeline Configuration Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PIPELINE.slice(0, 5).map((step) => (
              <div key={step.id} className="flex items-start gap-2">
                <span className="text-xs font-black text-amber-600 mt-0.5">{step.id}.</span>
                <div>
                  <div className="text-xs text-stone-500">{step.title}</div>
                  <div className="text-sm font-bold text-stone-800">{state[`step${step.id}`]?.label}</div>
                </div>
              </div>
            ))}
          </div>
          {deployed && (
            <div className="mt-4 pt-4 border-t border-amber-200 flex items-center gap-2 text-sm font-bold text-green-700">
              <Check className="w-5 h-5" /> Pipeline deployed successfully!
            </div>
          )}
        </div>
      )}
    </div>
  );
}