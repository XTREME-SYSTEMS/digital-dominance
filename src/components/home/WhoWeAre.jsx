import React from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, Calendar, MapPin, GraduationCap, Building2, Award } from "lucide-react";
import { Image } from "@/components/ui/image";

const TRAINING_IMG = "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/8bb317033_IMG_8152-min_c55bf5c4-40e1-4893-b5c7-699a395f36c6.jpg";
const SHOWROOM_IMG = "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/74e7fe427_images1.jpg";
const XPS_IMG = "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/92ad83dc2_xtreme-polishing-systems-blog-paragraph_03_d7345246-7dbb-4a6d-8e86-08bcc63927be.webp";
const CHRIS_IMG = "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/910b91397_chris-lavin-xtreme-polishing-systems-600w.webp";
const TEAM_IMG = "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/c77e33573_images5.jpg";
const SALES_MANAGER_IMG = "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/e39b97788_images7.jpg";
const ROBERT_PCU_IMG = "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/2b4d8139f_images8.jpg";
const PCU_IMG = "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/1896152f7_121725747_3705443039488227_8851277793604007373_n.jpg";
const OFFICE_LADIES_IMG = "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/aa7e294d6_images6.jpg";
const COO_IMG = "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/b077aba0c_images3.jpg";
const WAREHOUSE_IMG = "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/1412966f7_generated_image.png";
const EQUIPMENT_IMG = "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/4d72a767f_348s.jpg";
const FLOOR_FINISH_IMG = "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/613289773_images9.jpg";
const ROCKSTAR_TEAM_IMG = "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/469544ab8_images5.jpg";

const stats = [
  { value: "30+", label: "Years in business" },
  { value: "70+", label: "Locations nationwide" },
  { value: "#1", label: "Concrete & epoxy trade school" },
  { value: "1,000s", label: "Floors polished & coated" }
];

const pillars = [
  {
    icon: Building2,
    name: "Xtreme Polishing Systems",
    img: XPS_IMG,
    body: "Our parent company and the nation's premier decorative concrete solutions provider for nearly 30 years. Based in Pompano Beach, FL, XPS manufactures and distributes the equipment, epoxy coatings, and tooling that contractors across the country rely on every day."
  },
  {
    icon: MapPin,
    name: "XPS Xpress",
    img: SHOWROOM_IMG,
    body: "A trusted global brand with more than 70 branches worldwide, XPS Xpress brings premium epoxy and concrete supplies, equipment, and fast shipping to pros and homeowners close to home — including our flagship store at 2200 NW 32nd Street, Pompano Beach, FL."
  },
  {
    icon: GraduationCap,
    name: "Polished Concrete University",
    img: TRAINING_IMG,
    body: "Our hands-on epoxy and polished concrete training school. Ranked the world's #1 trade school for the craft, PCU runs 5-day certification courses every month at our Epoxy Training Center — teaching the same techniques we use on your garage."
  }
];

export default function WhoWeAre({ settings }) {
  const sp = settings.salesperson || {};
  return (
    <section className="bg-white pt-10 pb-20 md:pt-12 md:pb-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="text-4xl md:text-6xl font-bold tracking-[0.25em] text-amber-500">WHO WE ARE</div>
          <h2 className="mt-10 text-3xl md:text-5xl font-semibold tracking-tight text-stone-900">
            Backed by Xtreme Polishing Systems
          </h2>
          <p className="mt-4 text-stone-600 max-w-3xl mx-auto leading-relaxed">
            Your estimate isn't coming from a lead farm. It's coming from a family-owned, Florida-based company that has been perfecting concrete and epoxy flooring for nearly 30 years — the same team that trains the pros and supplies the industry.
          </p>
        </div>

        {/* Stats band */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-stone-50 border border-stone-100 p-6 text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-stone-900">{s.value}</div>
              <div className="mt-1 text-xs md:text-sm text-stone-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Pillars */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {pillars.map((p) => (
            <div key={p.name} className="rounded-2xl border border-stone-200 overflow-hidden bg-white shadow-sm flex flex-col">
              <div className="h-44 bg-stone-100">
                <Image src={p.img} alt={p.name} fittingType="fill" className="h-full w-full" />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 mb-3">
                  <p.icon className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-stone-900">{p.name}</h3>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed">{p.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Leadership: Chris + Jeremy */}
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {/* Chris Lavin — owner */}
          <div className="md:col-span-2 rounded-3xl border border-stone-200 overflow-hidden bg-white shadow-sm">
            <div className="h-64 md:h-80 bg-stone-100">
              <Image src={CHRIS_IMG} alt="Chris Lavin on a floor grinder" fittingType="fill" focalPointX={0.5} focalPointY={0} className="h-full w-full" />
            </div>
            <div className="p-6">
              <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] text-amber-600">
                <Award className="h-4 w-4" /> OWNER & FOUNDER
              </div>
              <h3 className="mt-2 text-2xl font-semibold text-stone-900">Chris Lavin</h3>
              <p className="mt-3 text-sm text-stone-600 leading-relaxed">
                Chris built Xtreme Polishing Systems from the ground up over a 20+ year career, growing it into a multi-location national brand. He's renowned for polishing and epoxy coating more floors than anyone globally — and for training the next generation of pros through Polished Concrete University.
              </p>
              <p className="mt-3 text-sm text-stone-500 italic">
                "If you want to be something you've never been before, you've got to do something you've never done before."
              </p>
            </div>
          </div>

          {/* Warehouse — Pompano Beach, FL */}
          <div className="rounded-3xl border border-stone-200 overflow-hidden bg-white shadow-sm flex flex-col">
            <div className="bg-stone-950 h-64 md:h-80">
              <Image src={WAREHOUSE_IMG} alt="Inside the Xtreme Polishing Systems warehouse in Pompano Beach, Florida" fittingType="fill" focalPointX={0.5} focalPointY={0.5} className="h-full w-full" />
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] text-amber-600">
                <Building2 className="h-4 w-4" /> BEHIND THE SCENES
              </div>
              <h3 className="mt-2 text-lg font-semibold text-stone-900">Inside the XPS Warehouse</h3>
              <p className="mt-3 text-sm text-stone-600 leading-relaxed">
                Our 2200 NW 32nd Street headquarters in Pompano Beach, FL stocks the full catalog of industrial-grade epoxy coatings, polyurea topcoats, and diamond tooling — the same premium materials that go on your garage floor.
              </p>
            </div>
          </div>
        </div>

        {/* Sales Pros team — 3-image banner: Equipment | Rockstar Team | Floor Finish */}
        <div className="mt-16 rounded-3xl border border-stone-200 overflow-hidden bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <div className="h-44 sm:h-56 sm:flex-1">
              <Image
                src={EQUIPMENT_IMG}
                alt="Industrial-grade floor polishing equipment and dust collection system at the Xtreme Polishing Systems showroom"
                fittingType="fill"
                focalPointX={0.5}
                focalPointY={0.5}
                className="h-full w-full"
              />
            </div>
            <div className="h-48 sm:h-80 sm:flex-[2.5]">
              <Image
                src={ROCKSTAR_TEAM_IMG}
                alt="Xtreme Polishing Systems rockstar sales pros team with industrial floor polishing equipment — Xtreme Projects Need Xtreme Solutions"
                fittingType="fill"
                focalPointX={0.65}
                focalPointY={0.5}
                className="h-full w-full"
              />
            </div>
            <div className="h-44 sm:h-56 sm:flex-1">
              <Image
                src={FLOOR_FINISH_IMG}
                alt="High-gloss metallic epoxy polished concrete floor finish by Xtreme Polishing Systems"
                fittingType="fill"
                focalPointX={0.5}
                focalPointY={0.5}
                className="h-full w-full"
              />
            </div>
          </div>
          {/* Headline banner */}
          <div className="bg-stone-950 px-6 py-8 md:py-10 text-center border-t border-amber-500/30">
            <h3 className="text-xl md:text-3xl font-extrabold text-white leading-tight tracking-tight">
              Grade A Equipment <span className="text-amber-500">+</span> Excellent Sales Team <span className="text-amber-500">=</span> Amazing Floors <span className="text-amber-500">=</span> Choose XPS for Install or Sales
            </h3>
          </div>
          <div className="p-6 md:p-10">
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] text-amber-600">
              <Award className="h-4 w-4" /> OUR ROCKSTAR SALES PROS &amp; PCU TRAINERS
            </div>
            <h3 className="mt-2 text-2xl md:text-3xl font-semibold text-stone-900">
              Meet the Epoxy Flooring Sales Team &amp; Trainers Behind Your Estimate
            </h3>
            <p className="mt-4 text-sm md:text-base text-stone-600 leading-relaxed">
              When you request a <strong>garage floor coating estimate</strong> from Xtreme Polishing Systems, you're not handed off to a call center. You work directly with our rockstar sales pros — seasoned <strong>concrete and epoxy flooring specialists</strong> who have spent years grinding, polishing, and coating real residential and commercial floors. Every member of our sales team graduates from <strong>Polished Concrete University</strong>, the world's #1 decorative concrete and epoxy training school, so they can answer technical questions about <strong>surface prep, moisture mitigation, flake systems, and hot-tire resistance</strong> that a typical lead-gen rep simply can't. Shop our full catalog of industrial-grade epoxy coatings, polyurea topcoats, and diamond tooling at{" "}
              <a href="https://xtremepolishingsystems.com" target="_blank" rel="noopener noreferrer" className="text-black underline font-bold hover:text-amber-600">xtremepolishingsystems.com</a>.
            </p>

            <div className="mt-6 grid sm:grid-cols-2 gap-5">
              <div>
                <h4 className="text-sm font-bold text-stone-900">Who Is the Sales Manager at Xtreme Polishing Systems?</h4>
                <p className="mt-1.5 text-sm text-stone-600 leading-relaxed">
                  Our <strong>Sales Manager</strong> (left) has run the same floor grinders, scarifiers, and epoxy application equipment you'll see on your project. He specializes in <strong>FlexQuartz</strong> seamless flake systems and 100% solids epoxy — meaning accurate square-footage takeoffs, honest condition assessments, and product recommendations tailored to your garage. Whether you need a 100% solids epoxy system, a metallic floor, or a decorative flake coating, he matches the right system to your slab.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900">Who Is Robert, the PCU Master Trainer?</h4>
                <p className="mt-1.5 text-sm text-stone-600 leading-relaxed">
                  <strong>Robert</strong> (right) is the star <strong>Polished Concrete University</strong> trainer and has been with Xtreme Polishing Systems for <strong>10 years</strong>. He teaches hands-on <strong>Stardek coating skills</strong>, concrete polishing, and epoxy resin application at our Pompano Beach, FL Epoxy Training Center — the same techniques our sales pros use to spec your floor. Learn more about our training programs and shop pro-grade products at{" "}
                  <a href="https://xtremepolishingsystems.com" target="_blank" rel="noopener noreferrer" className="text-black underline font-bold hover:text-amber-600">xtremepolishingsystems.com</a>.
                </p>
              </div>
            </div>

            <div className="mt-6 grid sm:grid-cols-2 gap-5">
              <div>
                <h4 className="text-sm font-bold text-stone-900">Real Floor Coating Experts, Not Scripted Reps</h4>
                <p className="mt-1.5 text-sm text-stone-600 leading-relaxed">
                  Our sales pros have run the same floor grinders, scarifiers, and epoxy application equipment you'll see on your project. That hands-on experience means accurate square-footage takeoffs, honest condition assessments, and product recommendations tailored to your garage — whether you need a 100% solids epoxy system, a metallic floor, or a decorative flake coating. Browse the full epoxy coating and tooling catalog at{" "}
                  <a href="https://xtremepolishingsystems.com" target="_blank" rel="noopener noreferrer" className="text-black underline font-bold hover:text-amber-600">xtremepolishingsystems.com</a>.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900">Backed by America's #1 Epoxy Superstore</h4>
                <p className="mt-1.5 text-sm text-stone-600 leading-relaxed">
                  As the in-house sales team for Xtreme Polishing Systems and XPS Xpress — with <strong>70+ locations nationwide</strong> — our pros have direct access to the manufacturer's full catalog of industrial-grade epoxy coatings, polyurea topcoats, and diamond tooling. That means faster quotes, transparent pricing, and premium materials on every garage floor coating estimate. Order direct from the manufacturer at{" "}
                  <a href="https://xtremepolishingsystems.com" target="_blank" rel="noopener noreferrer" className="text-black underline font-bold hover:text-amber-600">xtremepolishingsystems.com</a>.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-stone-50 border border-stone-200 p-5 md:p-6">
              <h4 className="text-sm font-bold text-stone-900">Frequently Asked Questions About Our Epoxy Flooring Team</h4>
              <div className="mt-4 space-y-4 text-sm text-stone-600 leading-relaxed">
                <div>
                  <p className="font-semibold text-stone-900">Are your epoxy flooring sales reps trained professionals?</p>
                  <p className="mt-1">Yes. Every sales pro graduates from Polished Concrete University, the world's #1 hands-on concrete polishing and epoxy resin training school, located in Pompano Beach, FL.</p>
                </div>
                <div>
                  <p className="font-semibold text-stone-900">How many locations does Xtreme Polishing Systems have?</p>
                  <p className="mt-1">Xtreme Polishing Systems and XPS Xpress operate 70+ locations nationwide, with our flagship store and warehouse at 2200 NW 32nd Street, Pompano Beach, FL.</p>
                </div>
                <div>
                  <p className="font-semibold text-stone-900">Where can I buy Xtreme Polishing Systems epoxy coatings?</p>
                  <p className="mt-1">You can shop the full catalog of industrial-grade epoxy coatings, polyurea topcoats, and diamond tooling direct from the manufacturer at{" "}
                    <a href="https://xtremepolishingsystems.com" target="_blank" rel="noopener noreferrer" className="text-black underline font-bold hover:text-amber-600">xtremepolishingsystems.com</a>.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-stone-900">What epoxy systems do you install on garage floors?</p>
                  <p className="mt-1">We install 100% solids epoxy, decorative flake systems (FlexQuartz), metallic epoxy floors, polyurea topcoats, and Stardek coating systems — all backed by manufacturer-grade materials from{" "}
                    <a href="https://xtremepolishingsystems.com" target="_blank" rel="noopener noreferrer" className="text-black underline font-bold hover:text-amber-600">xtremepolishingsystems.com</a>.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-6 text-sm text-stone-500 leading-relaxed">
              From your first phone consultation to the final walk-through, our epoxy flooring sales professionals guide you through every step — system selection, color and flake choice, pricing, scheduling, and installation day. It's the white-glove experience homeowners across South Florida and beyond have come to expect from the nation's leader in residential garage floor coatings. Visit{" "}
              <a href="https://xtremepolishingsystems.com" target="_blank" rel="noopener noreferrer" className="text-black underline font-bold hover:text-amber-600">xtremepolishingsystems.com</a>{" "}
              to explore our full lineup of epoxy coating products, training courses, and equipment.
            </p>
          </div>
        </div>

        {/* Polished Concrete University */}
        <div className="mt-16 grid md:grid-cols-2 gap-8 items-center rounded-3xl border border-stone-200 overflow-hidden bg-white shadow-sm">
          <div className="bg-stone-950 h-56 md:h-full min-h-[280px]">
            <Image src={PCU_IMG} alt="Polished Concrete University hands-on epoxy and concrete polishing certification class" fittingType="fill" focalPointX={0.5} focalPointY={0.5} className="h-full w-full" />
          </div>
          <div className="p-6 md:p-10">
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] text-amber-600">
              <GraduationCap className="h-4 w-4" /> POLISHED CONCRETE UNIVERSITY
            </div>
            <h3 className="mt-2 text-2xl md:text-3xl font-semibold text-stone-900">
              The World's #1 Epoxy &amp; Concrete Polishing School
            </h3>
            <p className="mt-4 text-sm md:text-base text-stone-600 leading-relaxed">
              Since 2017, Polished Concrete University has run hands-on, 5-day certification courses at our Pompano Beach, FL Epoxy Training Center. As the educational arm of Xtreme Polishing Systems, PCU trains the next generation of concrete polishing and epoxy resin professionals on the exact equipment, coatings, and techniques used on real jobs.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-stone-600">
              <li className="flex gap-2"><Award className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /> 5-day hands-on certification in concrete polishing, epoxy resin, and surface repair</li>
              <li className="flex gap-2"><Award className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /> Master professional equipment, concrete stains, logos, and decorative imaging</li>
              <li className="flex gap-2"><Award className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /> Learn bidding, estimating, marketing, and lead-sourcing to grow your business</li>
              <li className="flex gap-2"><Award className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /> Lifetime support from the XPS pros — the same experts behind your estimate</li>
            </ul>
            <p className="mt-5 text-sm text-stone-500 leading-relaxed">
              Every sales pro on your project is a PCU-trained specialist, so you get manufacturer-grade knowledge on surface prep, moisture mitigation, and epoxy system selection — not a scripted call-center rep.
            </p>
          </div>
        </div>

        {/* Office team + COO */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 items-stretch">
          {/* Office ladies */}
          <div className="md:col-span-2 rounded-3xl border border-stone-200 overflow-hidden bg-white shadow-sm">
            <div className="bg-stone-950 h-56 md:h-72">
              <Image src={OFFICE_LADIES_IMG} alt="Xtreme Polishing Systems office team women in XPS logo shirts" fittingType="fill" focalPointX={0.5} focalPointY={0.4} className="h-full w-full" />
            </div>
            <div className="p-6">
              <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] text-amber-600">
                <Building2 className="h-4 w-4" /> OUR OFFICE TEAM
              </div>
              <h3 className="mt-2 text-xl font-semibold text-stone-900">The Women Behind the Operations</h3>
              <p className="mt-3 text-sm text-stone-600 leading-relaxed">
                From quotes and scheduling to logistics and customer care, our office team keeps every garage floor coating project moving. These are the dedicated professionals who answer your calls, coordinate your installation, and make sure your experience with Xtreme Polishing Systems feels personal from first contact to final coat.
              </p>
            </div>
          </div>

          {/* COO */}
          <div className="rounded-3xl border border-stone-200 overflow-hidden bg-white shadow-sm flex flex-col">
            <div className="bg-stone-100 h-64 md:h-72">
              <Image src={COO_IMG} alt="Xtreme Polishing Systems Chief Operating Officer portrait" fittingType="fill" focalPointX={0.5} focalPointY={0.35} className="h-full w-full" />
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] text-amber-600">
                <Award className="h-4 w-4" /> CHIEF OPERATING OFFICER
              </div>
              <h3 className="mt-2 text-xl font-semibold text-stone-900">Our COO</h3>
              <p className="mt-3 text-sm text-stone-600 leading-relaxed">
                Leading day-to-day operations across our 70+ locations, our COO ensures every estimate, installation, and customer interaction meets the standard homeowners expect from America's #1 epoxy superstore.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}