import React from 'react';
import { Building2, BriefcaseBusiness, Quote, Images, Star, Palette, Camera } from 'lucide-react';
import BusinessDetails from './wizard/BusinessDetails';
import IndustryServices from './wizard/IndustryServices';
import SloganField from './wizard/SloganField';
import BrandAssets from './wizard/BrandAssets';
import StarRatingField from './wizard/StarRatingField';
import AccentComboPicker from './wizard/AccentComboPicker';
import ImageConceptPicker from './wizard/ImageConceptPicker';

function Section({ title, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4">
      <h4 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-500">
        <Icon className="h-3.5 w-3.5 text-[#00a2ff]" aria-hidden="true" /> {title}
      </h4>
      {children}
    </section>
  );
}

export default function BusinessProfileStep({ value, onChange, chosenImages = [], onPickImages }) {
  const set = patch => onChange({ ...value, ...patch });

  return (
    <div className="space-y-3">
      <Section title="Business details" icon={Building2}>
        <BusinessDetails value={value} set={set} />
      </Section>
      <Section title="Industry & services" icon={BriefcaseBusiness}>
        <IndustryServices value={value} set={set} />
      </Section>
      <Section title="Ratings & reviews" icon={Star}>
        <StarRatingField value={value} set={set} />
      </Section>
      <Section title="Accent colour" icon={Palette}>
        <AccentComboPicker value={value.accent} onPick={combo => set({ accent: combo.accent, accent_combo: combo.id })} />
      </Section>
      <Section title="Slogan" icon={Quote}>
        <SloganField value={value} set={set} />
      </Section>
      <Section title="Logo & photos" icon={Images}>
        <BrandAssets value={value} set={set} />
      </Section>
      {onPickImages && (
        <Section title="Generate images" icon={Camera}>
          <ImageConceptPicker profile={value} chosen={chosenImages} onPick={onPickImages} />
        </Section>
      )}
    </div>
  );
}