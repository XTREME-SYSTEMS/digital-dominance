import React from "react";
import { motion } from "framer-motion";
import HeroZipStart from "@/components/home/HeroZipStart";

export default function Hero({ settings }) {
  return (
    <section className="relative h-[82vh] min-h-[620px] bg-stone-950 overflow-hidden border-b-2 border-amber-500">
      <img
        src={settings.hero_image_url}
        alt="Premium residential garage with black, white and gray flake epoxy floor, gray cabinets and chrome countertops"
        className="absolute inset-0 w-full h-full object-cover object-[center_75%]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/55 to-transparent" />
      <div className="absolute inset-0 flex items-start md:items-center pt-28 md:pt-24">
        <div className="w-full max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
            <h1 className="mt-4 md:mt-5 font-display text-3xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.05] drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)]">
              How Much Will Your Epoxy Garage Floor Cost?
            </h1>
            <HeroZipStart />
            <a href="#callback" className="mt-5 inline-flex text-sm font-semibold text-white underline underline-offset-4 hover:text-amber-400">Prefer to talk to someone? Request a call</a>
            <p className="mt-3 text-sm font-medium text-white/90 drop-shadow-md">Free preliminary range · No obligation · Optional floor preview</p>
          </motion.div>
        </div>
      </div>

    </section>
  );
}