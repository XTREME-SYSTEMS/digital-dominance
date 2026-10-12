import React from "react";
import { Link } from "react-router-dom";

const STATS = [
  { label: "Public industries", value: "20 verified categories" },
  { label: "Connected client accounts", value: "Not connected" },
  { label: "Live jobs", value: "No verified job data" },
  { label: "Release authority", value: "Approval required" },
];

const TASKS = [
  { title: "Public industries", desc: "Connect a verified data source to activate", status: "20 verified categories" },
  { title: "Connected client accounts", desc: "Connect a verified data source to activate", status: "Not connected" },
  { title: "Live jobs", desc: "Connect a verified data source to activate", status: "No verified job data" },
  { title: "Release authority", desc: "Connect a verified data source to activate", status: "Approval required" },
];

export default function LaunchEngineAdmin() {
  return (
    <div className="mx-auto max-w-[1540px] p-[clamp(23px,4vw,55px)]">
      {/* Hero */}
      <div
        className="flex items-center justify-between gap-6 rounded-[18px] p-[clamp(25px,4vw,53px)] text-white shadow-[0_20px_50px_#092c4f28]"
        style={{
          backgroundImage:
            "linear-gradient(108deg, #031b34f7, #0b3e70ed), url(https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1800&q=82)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div>
          <div className="text-[12px] font-extrabold tracking-[0.17em] text-[#7dd5ff]">WORKSPACE FOUNDATION · V1</div>
          <h1 className="my-2.5 text-[clamp(32px,4vw,48px)] font-black leading-[1.04]">Command dashboard</h1>
          <p className="max-w-[680px] text-[17px] leading-[1.55] text-[#c6dff4]">
            Review the factory's operational readiness and open the public catalog.
          </p>
        </div>
        <div className="shrink-0 rounded-[12px] border border-[#73b3e6] bg-[#0b325a] px-4 py-3 text-[13px] font-bold text-white">
          ◈ DEVELOPMENT PREVIEW
        </div>
      </div>

      {/* Stats */}
      <div className="mt-[25px] grid grid-cols-1 gap-[17px] sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="min-h-[145px] rounded-[13px] border border-[#dbe7f3] bg-white p-6 shadow-[0_8px_19px_#143f6710]"
          >
            <small className="block text-[13px] text-[#5b7288]">{s.label}</small>
            <strong className="mt-[19px] block text-[clamp(19px,2.2vw,27px)] font-black leading-[1.13] text-[#06355f]">
              {s.value}
            </strong>
          </div>
        ))}
      </div>

      {/* Panels */}
      <div className="mt-[26px] grid gap-[21px] lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,1fr)]">
        <section className="rounded-[13px] border border-[#d9e5ef] bg-white p-7">
          <h2 className="mb-3.5 text-2xl font-black tracking-[-0.035em] text-[#06355f]">Quick overview</h2>
          <p className="text-[15px] leading-[1.6] text-[#50657d]">
            This is the preview of the overview workspace, with live integrations deliberately disabled.
          </p>
          <div className="mt-4">
            {TASKS.map((t) => (
              <div
                key={t.title}
                className="flex items-center justify-between gap-4 border-b border-[#e4edf5] py-4"
              >
                <div>
                  <b className="text-[15px] text-[#06355f]">{t.title}</b>
                  <small className="mt-1.5 block text-[12px] text-[#607790]">{t.desc}</small>
                </div>
                <span className="whitespace-nowrap rounded-[7px] bg-[#ebf2f8] px-2.5 py-2 text-[12px] text-[#3c5974]">
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-[13px] border border-[#d9e5ef] bg-white p-7">
          <h2 className="mb-3.5 text-2xl font-black tracking-[-0.035em] text-[#06355f]">What happens next?</h2>
          <p className="text-[15px] leading-[1.6] text-[#50657d]">
            Enable verified account authentication, tenant permissions, and durable data connections before this portal
            processes real customer information.
          </p>
          <Link
            to="/templates"
            className="mt-4 inline-flex items-center rounded-[8px] bg-[#0976e9] px-[17px] py-3 text-[14px] font-extrabold text-white"
          >
            Explore Website Templates →
          </Link>
          <br />
          <a
            href="tel:+17722090266"
            className="mt-2.5 inline-flex items-center rounded-[8px] bg-[#e8f2fd] px-[17px] py-3 text-[14px] font-extrabold text-[#1463a4]"
          >
            Call (772) 209-0266 ↗
          </a>
        </aside>
      </div>

      {/* Notice */}
      <div className="mt-[22px] rounded-[8px] border-l-4 border-[#e2ab3e] bg-[#fff4df] px-5 py-[18px] text-[14px] leading-[1.55] text-[#725119]">
        <b>Preview limitations:</b> This portal uses only static, non-sensitive placeholder states. No sign-in, lead
        delivery, client data, queue execution, billing, or release action is active. Production data must not be entered.
      </div>

      <div className="mt-5 text-[13px] text-[#64809b]">
        © 2026 Website Launch Engine · A Strategic Minds AI System ·{" "}
        <Link to="/" className="font-extrabold text-[#1674c5]">Home</Link> ·{" "}
        <a href="tel:+17722090266" className="font-extrabold text-[#1674c5]">Contact</a>
      </div>
    </div>
  );
}