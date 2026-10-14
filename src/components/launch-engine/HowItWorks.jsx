import React from 'react';
import { ArrowRight, BadgeCheck, LayoutTemplate, MapPinned, MousePointerClick, Palette, Rocket, Search } from 'lucide-react';

const STEPS = [
  { number: '01', icon: Search, title: 'Choose Your Industry', description: 'Explore the industry gallery and select your business category.' },
  { number: '02', icon: LayoutTemplate, title: 'Pick a Real Template', description: 'Open a full-page preview and review the design before choosing it.' },
  { number: '03', icon: Palette, title: 'Customize Your Brand', description: 'Define the colors, content, service offering, and markets you need.' },
  { number: '04', icon: BadgeCheck, title: 'Approve Before Launch', description: 'Review the completed preview, run validation, and approve any release.' },
];

const OPTIONS = [
  { icon: MousePointerClick, title: 'One Great Website', description: 'For a business ready to launch a polished, conversion-focused digital home.' },
  { icon: MapPinned, title: 'Multi-Market Expansion', description: 'For teams exploring more than one verified target market with distinctive content.' },
  { icon: Rocket, title: 'Website Factory', description: 'For larger approved portfolios with preview, validation, and release controls.' },
];

export default function HowItWorks() {
  return (
    <>
      <section id="how" className="bg-white py-14 text-[#071b34] md:py-20">
        <div className="mx-auto max-w-[1480px] px-4 md:px-10">
          <p className="mb-2 text-xs font-black uppercase tracking-[.2em] text-[#057cea]">SIMPLE PROCESS</p>
          <h2 className="font-heading text-3xl font-black tracking-[-.04em] md:text-5xl">How It Works</h2>
          <p className="mt-2 max-w-2xl text-base text-slate-600 md:text-lg">Choose a design, see the details, and approve what gets built. No surprises and no unreviewed launches.</p>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ number, icon: Icon, title, description }) => (
              <div key={number} className="relative rounded-2xl border border-[#d9e6f4] bg-[#f7fbff] p-5 shadow-[0_8px_24px_rgba(3,41,82,.05)]">
                <div className="mb-4 flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#086dee] text-sm font-black text-white">{number}</span>
                  <Icon aria-hidden="true" className="h-8 w-8 text-[#0877ea]" />
                </div>
                <h3 className="text-lg font-extrabold text-[#0a1220]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-[#edf5fd] py-14 text-[#071b34] md:py-20">
        <div className="mx-auto max-w-[1480px] px-4 md:px-10">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[.2em] text-[#057cea]">BUILT TO GROW</p>
              <h2 className="font-heading text-3xl font-black tracking-[-.04em] md:text-4xl">Launch One. Grow With Confidence.</h2>
              <p className="mt-2 max-w-2xl text-base text-slate-600">Choose a launch path that matches your real business goals. Exact scope and pricing are confirmed in a proposal.</p>
            </div>
            <a href="#contact" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#086dee] px-5 font-extrabold text-white transition hover:bg-[#004fae]">
              Discuss Your Project <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {OPTIONS.map(({ icon: Icon, title, description }) => (
              <a key={title} href="#contact" className="group rounded-2xl border border-[#cbdff1] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#0877ea] hover:shadow-lg">
                <Icon aria-hidden="true" className="h-9 w-9 text-[#0877ea]" />
                <h3 className="mt-4 text-xl font-extrabold">{title}</h3>
                <p className="mt-2 min-h-16 text-sm leading-6 text-slate-600">{description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#086dee]">Get a tailored quote <ArrowRight className="h-4 w-4" /></span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
