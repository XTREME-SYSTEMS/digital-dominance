import React from 'react';
import { Star } from 'lucide-react';
import { Field, inputCls, Choice } from './wizardFields';

/**
 * Asks whether the business has star ratings to show. Nothing about reviews is
 * ever put on the site unless the owner says they have them.
 */
export default function StarRatingField({ value, set }) {
  return (
    <div className="space-y-3">
      <Field label="Customer star rating" hint="Nothing about reviews appears on your site unless you have them.">
        <div className="grid gap-2 sm:grid-cols-2">
          <Choice
            checked={!!value.has_rating}
            onClick={() => set({ has_rating: true, rating_value: value.rating_value || 5 })}
            title="Yes, I have ratings"
            desc="We show your score on the site."
          />
          <Choice
            checked={!value.has_rating}
            onClick={() => set({ has_rating: false, rating_value: 0, rating_count: 0 })}
            title="No ratings to show"
            desc="Every star and review block is removed."
          />
        </div>
      </Field>

      {value.has_rating && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Rating out of 5">
            <input
              className={inputCls}
              inputMode="decimal"
              value={value.rating_value}
              onChange={e => set({ rating_value: Math.min(5, Math.max(0, Number(e.target.value.replace(/[^\d.]/g, '')) || 0)) })}
              placeholder="4.9"
            />
          </Field>
          <Field label="How many reviews (optional)">
            <input
              className={inputCls}
              inputMode="numeric"
              value={value.rating_count}
              onChange={e => set({ rating_count: Number(e.target.value.replace(/\D/g, '')) || 0 })}
              placeholder="128"
            />
          </Field>
        </div>
      )}

      {value.has_rating && (
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
          <Star className="h-3.5 w-3.5 fill-current text-[#00a2ff]" /> Your site will read “Rated {Number(value.rating_value) || 5} out of 5”.
        </p>
      )}
    </div>
  );
}