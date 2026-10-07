import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { invokeLLM } from "@/lib/gateway";
import { ArrowRight, ArrowLeft, FileText, Loader2, Sparkles, Check, Copy } from "lucide-react";

export default function ContentStudio({ config, update, onNext, onBack }) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);
  const industry = config.industry;

  const generateContent = async () => {
    setGenerating(true);
    setError(null);
    try {
      const prompt = `You are generating website content for a ${industry.label} business called "${config.businessName}".
The business is located in ${config.city || "[City]"}, ${config.state || "[State]"}.
The accent color is ${config.accentName} (${config.accentColor}).
Emergency level: ${industry.emergency}.
Psychology: ${industry.psychology}.

Generate a complete website content package as JSON with these fields:
- hero_headline: A powerful headline (max 60 chars)
- hero_subhead: A compelling subheadline (max 120 chars)
- about_text: 2-3 paragraphs about the company
- services: Array of {name, description, icon_hint} for each service
- why_choose_us: Array of 4 short value propositions
- testimonials: Array of 3 {name, text, rating}
- faqs: Array of 5 {question, answer}
- service_areas: Array of 5 nearby city names
- meta_description: SEO meta description (max 155 chars)
- tagline: Short tagline for the header

Make it specific to the ${industry.label} industry. Use urgency and trust language appropriate for ${industry.emergency} emergency level.
Return ONLY valid JSON.`;

      const res = await invokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            hero_headline: { type: "string" },
            hero_subhead: { type: "string" },
            about_text: { type: "string" },
            services: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  icon_hint: { type: "string" },
                },
              },
            },
            why_choose_us: { type: "array", items: { type: "string" } },
            testimonials: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  text: { type: "string" },
                  rating: { type: "number" },
                },
              },
            },
            faqs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  answer: { type: "string" },
                },
              },
            },
            service_areas: { type: "array", items: { type: "string" } },
            meta_description: { type: "string" },
            tagline: { type: "string" },
          },
        },
      });

      if (res) {
        update({ content: res });
      }
    } catch (e) {
      setError(e.message || "Failed to generate content");
    } finally {
      setGenerating(false);
    }
  };

  const copyField = (key, text) => {
    navigator.clipboard.writeText(typeof text === "string" ? text : JSON.stringify(text, null, 2));
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const content = config.content;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-stone-900">Step 3 — Content Generator</h2>
        <p className="text-sm text-stone-500 mt-1">
          AI-generate all website content: headlines, about, services, testimonials, FAQs, and SEO meta —
          tailored to {industry.label}.
        </p>
      </div>

      {!content && (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
          <FileText className="h-12 w-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-stone-900 mb-2">Generate Content Package</h3>
          <p className="text-sm text-stone-500 mb-4 max-w-md mx-auto">
            Click below to generate a complete content package for {config.businessName || industry.label}.
            This includes hero text, about page, services, testimonials, FAQs, and SEO metadata.
          </p>
          <button
            onClick={generateContent}
            disabled={generating}
            className="px-6 py-3 rounded-lg bg-stone-900 text-white font-bold text-sm hover:bg-stone-800 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            {generating ? "Generating Content..." : "Generate Content Package"}
          </button>
          {error && <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
        </div>
      )}

      {content && (
        <>
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <Check className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">Content generated successfully</span>
            <button onClick={generateContent} disabled={generating} className="ml-auto text-xs text-amber-600 font-semibold hover:underline flex items-center gap-1">
              {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Regenerate
            </button>
          </div>

          {/* Hero */}
          <ContentBlock title="Hero Section" onCopy={() => copyField("hero", `${content.hero_headline}\n\n${content.hero_subhead}`)} copied={copied === "hero"}>
            <h3 className="text-2xl font-bold text-stone-900">{content.hero_headline}</h3>
            <p className="text-stone-600 mt-1">{content.hero_subhead}</p>
          </ContentBlock>

          {/* Tagline + Meta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ContentBlock title="Tagline" onCopy={() => copyField("tagline", content.tagline)} copied={copied === "tagline"}>
              <p className="text-sm text-stone-700">{content.tagline}</p>
            </ContentBlock>
            <ContentBlock title="SEO Meta Description" onCopy={() => copyField("meta", content.meta_description)} copied={copied === "meta"}>
              <p className="text-xs text-stone-600">{content.meta_description}</p>
            </ContentBlock>
          </div>

          {/* About */}
          <ContentBlock title="About Us" onCopy={() => copyField("about", content.about_text)} copied={copied === "about"}>
            <p className="text-sm text-stone-700 whitespace-pre-wrap">{content.about_text}</p>
          </ContentBlock>

          {/* Services */}
          <ContentBlock title="Services" onCopy={() => copyField("services", content.services)} copied={copied === "services"}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {content.services?.map((s, i) => (
                <div key={i} className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                  <div className="font-semibold text-sm text-stone-900">{s.name}</div>
                  <div className="text-xs text-stone-500 mt-0.5">{s.description}</div>
                </div>
              ))}
            </div>
          </ContentBlock>

          {/* Why Choose Us */}
          <ContentBlock title="Why Choose Us" onCopy={() => copyField("why", content.why_choose_us)} copied={copied === "why"}>
            <ul className="space-y-1.5">
              {content.why_choose_us?.map((w, i) => (
                <li key={i} className="text-sm text-stone-700 flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /> {w}
                </li>
              ))}
            </ul>
          </ContentBlock>

          {/* Testimonials */}
          <ContentBlock title="Testimonials" onCopy={() => copyField("testimonials", content.testimonials)} copied={copied === "testimonials"}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {content.testimonials?.map((t, i) => (
                <div key={i} className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                  <div className="text-xs text-stone-600 italic">"{t.text}"</div>
                  <div className="text-xs font-semibold text-stone-900 mt-2">— {t.name}</div>
                  <div className="text-xs text-amber-500">{"★".repeat(t.rating)}</div>
                </div>
              ))}
            </div>
          </ContentBlock>

          {/* FAQs */}
          <ContentBlock title="FAQs" onCopy={() => copyField("faqs", content.faqs)} copied={copied === "faqs"}>
            <div className="space-y-2">
              {content.faqs?.map((f, i) => (
                <div key={i} className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                  <div className="text-sm font-semibold text-stone-900">{f.question}</div>
                  <div className="text-xs text-stone-600 mt-1">{f.answer}</div>
                </div>
              ))}
            </div>
          </ContentBlock>

          {/* Service Areas */}
          <ContentBlock title="Service Areas" onCopy={() => copyField("areas", content.service_areas)} copied={copied === "areas"}>
            <div className="flex flex-wrap gap-2">
              {content.service_areas?.map((a, i) => (
                <span key={i} className="px-3 py-1 rounded-lg bg-stone-100 text-stone-600 text-xs font-semibold">{a}</span>
              ))}
            </div>
          </ContentBlock>
        </>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack} className="px-5 py-2.5 rounded-lg border border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button onClick={onNext} disabled={!content} className="px-6 py-2.5 rounded-lg bg-amber-500 text-stone-950 font-bold text-sm hover:bg-amber-400 disabled:opacity-50 flex items-center gap-2">
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ContentBlock({ title, children, onCopy, copied }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider">{title}</h3>
        <button onClick={onCopy} className="text-xs text-stone-500 hover:text-amber-600 font-semibold flex items-center gap-1">
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {children}
    </div>
  );
}