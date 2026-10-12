import React from "react";
import ReactMarkdown from "react-markdown";
import { Image } from "@/components/ui/image";
import { Phone, Star, ArrowRight } from "lucide-react";

function HeroSection({ title, subtitle, bg_image, cta_text, cta_link }) {
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-stone-950">
      {bg_image && <Image src={bg_image} fittingType="fill" className="absolute inset-0 w-full h-full opacity-60" />}
      <div className="relative z-10 text-center px-6 py-20 max-w-3xl">
        {title && <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{title}</h1>}
        {subtitle && <p className="text-lg text-stone-200 mb-8">{subtitle}</p>}
        {cta_text && (
          <a href={cta_link || "#"} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-amber-500 text-stone-950 font-bold text-lg hover:bg-amber-400 transition">
            {cta_text} <ArrowRight className="h-5 w-5" />
          </a>
        )}
      </div>
    </section>
  );
}

function TextSection({ heading, body, image_url, image_position }) {
  const img = image_url ? <Image src={image_url} fittingType="fill" className="w-full h-64 rounded-xl" /> : null;
  return (
    <section className="py-16 px-6 max-w-4xl mx-auto">
      {heading && <h2 className="text-3xl font-bold text-stone-900 mb-6">{heading}</h2>}
      <div className="grid md:grid-cols-2 gap-8 items-center">
        {image_position === "right" ? (
          <><div className="prose prose-lg max-w-none text-stone-700"><ReactMarkdown>{body || ""}</ReactMarkdown></div>{img}</>
        ) : image_position === "left" ? (
          <>{img}<div className="prose prose-lg max-w-none text-stone-700"><ReactMarkdown>{body || ""}</ReactMarkdown></div></>
        ) : (
          <div className="md:col-span-2 prose prose-lg max-w-none text-stone-700"><ReactMarkdown>{body || ""}</ReactMarkdown></div>
        )}
      </div>
    </section>
  );
}

function GallerySection({ title, images }) {
  return (
    <section className="py-16 px-6 bg-stone-50">
      <div className="max-w-5xl mx-auto">
        {title && <h2 className="text-3xl font-bold text-stone-900 mb-8 text-center">{title}</h2>}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(images || []).map((img, i) => (
            <div key={i} className="rounded-xl overflow-hidden">
              <Image src={img.url} fittingType="fill" className="w-full h-48" />
              {img.caption && <p className="text-sm text-stone-500 mt-2 text-center">{img.caption}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection({ title, subtitle, button_text, button_link }) {
  return (
    <section className="py-16 px-6">
      <div className="max-w-3xl mx-auto rounded-2xl bg-stone-950 p-12 text-center">
        {title && <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>}
        {subtitle && <p className="text-lg text-stone-300 mb-8">{subtitle}</p>}
        {button_text && (
          <a href={button_link || "#"} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-amber-500 text-stone-950 font-bold text-lg hover:bg-amber-400 transition">
            {button_text} <ArrowRight className="h-5 w-5" />
          </a>
        )}
      </div>
    </section>
  );
}

function FaqSection({ title, items }) {
  return (
    <section className="py-16 px-6 max-w-3xl mx-auto">
      {title && <h2 className="text-3xl font-bold text-stone-900 mb-8 text-center">{title}</h2>}
      <div className="space-y-4">
        {(items || []).map((item, i) => (
          <div key={i} className="rounded-xl border border-stone-200 p-6">
            <h3 className="font-bold text-stone-900 mb-2">{item.question}</h3>
            <p className="text-stone-600">{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TestimonialsSection({ title, items }) {
  return (
    <section className="py-16 px-6 bg-stone-50">
      <div className="max-w-4xl mx-auto">
        {title && <h2 className="text-3xl font-bold text-stone-900 mb-8 text-center">{title}</h2>}
        <div className="grid md:grid-cols-2 gap-6">
          {(items || []).map((item, i) => (
            <div key={i} className="rounded-xl border border-stone-200 bg-white p-6">
              <div className="flex gap-1 mb-3">
                {Array.from({ length: item.rating || 5 }).map((_, j) => <Star key={j} className="h-4 w-4 fill-amber-500 text-amber-500" />)}
              </div>
              <p className="text-stone-700 italic mb-4">"{item.quote}"</p>
              <div className="text-sm font-bold text-stone-900">{item.name}</div>
              {item.location && <div className="text-xs text-stone-500">{item.location}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HtmlSection({ content }) {
  return <section className="py-8 px-6 max-w-4xl mx-auto"><div dangerouslySetInnerHTML={{ __html: content || "" }} /></section>;
}

function FormSection({ title, fields }) {
  return (
    <section className="py-16 px-6 max-w-xl mx-auto">
      {title && <h2 className="text-3xl font-bold text-stone-900 mb-8 text-center">{title}</h2>}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        {(fields || []).map((f, i) => (
          <div key={i}>
            <label className="text-sm font-bold text-stone-700 block mb-1">{f.label}{f.required && " *"}</label>
            {f.type === "textarea" ? (
              <textarea required={f.required} className="w-full rounded-lg border border-stone-200 px-4 py-3 text-sm" rows={4} />
            ) : (
              <input type={f.type || "text"} required={f.required} className="w-full h-12 rounded-lg border border-stone-200 px-4 text-sm" />
            )}
          </div>
        ))}
        <button type="submit" className="w-full h-14 rounded-xl bg-amber-500 text-stone-950 font-bold hover:bg-amber-400 transition">Submit</button>
      </form>
    </section>
  );
}

function SpacerSection({ height }) {
  return <div style={{ height: height || 40 }} />;
}

export const RENDERERS = {
  hero: HeroSection, text: TextSection, gallery: GallerySection, cta: CtaSection,
  faq: FaqSection, testimonials: TestimonialsSection, html: HtmlSection,
  form: FormSection, spacer: SpacerSection,
};

export default function DynamicPageRenderer({ page }) {
  if (!page || !page.sections) return null;
  return (
    <div className="min-h-screen bg-white">
      {page.sections.map((section, i) => {
        const Renderer = RENDERERS[section.type];
        if (!Renderer) return null;
        return <Renderer key={section.id || i} {...(section.props || {})} />;
      })}
    </div>
  );
}