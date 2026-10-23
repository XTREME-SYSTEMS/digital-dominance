import React from 'react';
import { Field, inputCls, Choice } from './wizardFields';

export default function BusinessDetails({ value, set }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Business name">
          <input
            className={inputCls}
            value={value.business_name}
            onChange={e => set({ business_name: e.target.value })}
            placeholder="Summit Concrete Coatings"
          />
        </Field>
        <Field label="Business phone">
          <input
            className={inputCls}
            inputMode="tel"
            value={value.phone}
            onChange={e => set({ phone: e.target.value })}
            placeholder="(555) 123-4567"
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Business email">
          <input
            className={inputCls}
            inputMode="email"
            value={value.email}
            onChange={e => set({ email: e.target.value })}
            placeholder="quotes@yourbusiness.com"
          />
        </Field>
      </div>

      <Field label="Business website">
        <div className="grid gap-2 sm:grid-cols-2">
          <Choice
            checked={value.website_mode === 'existing'}
            onClick={() => set({ website_mode: 'existing' })}
            title="I already have a website"
            desc="We keep the address on your new pages."
          />
          <Choice
            checked={value.website_mode === 'none'}
            onClick={() => set({ website_mode: 'none', website_url: '' })}
            title="None yet"
            desc="We launch a new site and suggest domains."
          />
        </div>
      </Field>

      {value.website_mode === 'existing' && (
        <Field label="Website address">
          <input
            className={inputCls}
            value={value.website_url}
            onChange={e => set({ website_url: e.target.value })}
            placeholder="https://yourbusiness.com"
          />
        </Field>
      )}

      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
        <Field label="Street address">
          <input
            className={inputCls}
            value={value.address}
            onChange={e => set({ address: e.target.value })}
            placeholder="1420 Industrial Way"
          />
        </Field>
        <Field label="City">
          <input
            className={inputCls}
            value={value.city}
            onChange={e => set({ city: e.target.value })}
            placeholder="Fort Lauderdale"
          />
        </Field>
        <Field label="State">
          <input
            className={`${inputCls} uppercase`}
            maxLength={2}
            value={value.state}
            onChange={e => set({ state: e.target.value.toUpperCase().slice(0, 2) })}
            placeholder="FL"
          />
        </Field>
      </div>

      <Field
        label={`Service radius — ${value.territory_radius_miles} miles`}
        hint="How far from your address you take work. This drives your local service-area pages."
      >
        <input
          type="range"
          min={5}
          max={200}
          step={5}
          value={value.territory_radius_miles}
          onChange={e => set({ territory_radius_miles: Number(e.target.value) })}
          className="w-full accent-[#00a2ff]"
        />
      </Field>
    </div>
  );
}