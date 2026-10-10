import React, { useState } from 'react';
import { Rocket, Loader2, MapPin, Shuffle, Check, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const US_CITIES = [
  'Orlando, FL', 'Tampa, FL', 'Miami, FL', 'Jacksonville, FL', 'Atlanta, GA', 'Charlotte, NC',
  'Raleigh, NC', 'Nashville, TN', 'Austin, TX', 'Dallas, TX', 'Houston, TX', 'San Antonio, TX',
  'Phoenix, AZ', 'Las Vegas, NV', 'Denver, CO', 'Salt Lake City, UT', 'Boise, ID',
  'Portland, OR', 'Seattle, WA', 'Sacramento, CA', 'Los Angeles, CA', 'San Diego, CA',
  'San Jose, CA', 'San Francisco, CA', 'Boise, ID', 'Billings, MT', 'Cheyenne, WY',
  'Albuquerque, NM', 'Oklahoma City, OK', 'Tulsa, OK', 'Kansas City, MO', 'St. Louis, MO',
  'Omaha, NE', 'Des Moines, IA', 'Minneapolis, MN', 'Madison, WI', 'Milwaukee, WI',
  'Chicago, IL', 'Indianapolis, IN', 'Columbus, OH', 'Cincinnati, OH', 'Cleveland, OH',
  'Detroit, MI', 'Louisville, KY', 'Lexington, KY', 'Pittsburgh, PA', 'Philadelphia, PA',
  'Harrisburg, PA', 'Buffalo, NY', 'Rochester, NY', 'Syracuse, NY', 'Albany, NY',
  'New York City, NY', 'Boston, MA', 'Providence, RI', 'Hartford, CT', 'Portland, ME',
  'Manchester, NH', 'Burlington, VT', 'Baltimore, MD', 'Washington, DC', 'Richmond, VA',
  'Norfolk, VA', 'Greensboro, NC', 'Charleston, SC', 'Columbia, SC', 'Savannah, GA',
  'Birmingham, AL', 'Montgomery, AL', 'Mobile, AL', 'Jackson, MS', 'Memphis, TN',
  'Knoxville, TN', 'Chattanooga, TN', 'Little Rock, AR', 'Fayetteville, AR',
  'Wichita, KS', 'Topeka, KS', 'Springfield, MO', 'Columbia, MO', 'Fargo, ND',
  'Sioux Falls, SD', 'Anchorage, AK', 'Honolulu, HI', 'Tucson, AZ', 'Mesa, AZ',
  'Chandler, AZ', 'Scottsdale, AZ', 'Frisco, TX', 'Plano, TX', 'Fort Worth, TX',
  'Arlington, TX', 'Garland, TX', 'Irving, TX', 'Lubbock, TX', 'Amarillo, TX',
  'El Paso, TX', 'McAllen, TX', 'Brownsville, TX', 'Beaumont, TX', 'Waco, TX',
];

export default function FunnelDeploy({ result, imageUrl }) {
  const [funnelCode, setFunnelCode] = useState(null);
  const [converting, setConverting] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [launched, setLaunched] = useState([]);
  const [error, setError] = useState('');
  const [variantCount, setVariantCount] = useState(50);

  const convertToFunnel = async () => {
    setConverting(true); setError('');
    try {
      const res = await base44.functions.invoke('vercelAiGateway', {
        action: 'generateText',
        prompt: `Convert this React component into a COMPLETE lead-generation funnel website for an epoxy garage floor company.\n\nOriginal component code:\n${result?.frontend_code || ''}\n\nThe funnel must include:\n1. Hero section with strong headline + CTA (Get Free Estimate)\n2. Trust signals (reviews, ratings, years in business)\n3. Before/after gallery section\n4. Service breakdown with pricing tiers\n5. Lead capture form (name, email, phone, zip code, garage size)\n6. FAQ section with epoxy-related questions\n7. Final CTA with urgency\n8. Mobile-first responsive design with gold/black branding\n\nUse Tailwind CSS classes, lucide-react icons, and the base44 SDK for form submission.\nThe form should POST to a backend function called "captureLead".\n\nReturn the COMPLETE funnel page as a single JSX file.`,
      });
      if (res.data?.error) throw new Error(res.data.error);
      setFunnelCode(res.data.text || res.data.parsed);
    } catch (e) { setError(e.message); }
    setConverting(false);
  };

  const massDeploy = async () => {
    setDeploying(true); setError(''); setLaunched([]);
    const cities = US_CITIES.slice(0, variantCount);
    let count = 0;
    for (const city of cities) {
      try {
        const [cityName, state] = city.split(', ');
        const variantRes = await base44.functions.invoke('vercelAiGateway', {
          action: 'generateText',
          prompt: `Create a unique SEO variant for an epoxy garage floor funnel in ${city}, ${state}.\nReturn ONLY a JSON object with: headline (mentioning the city), subheadline, cta_text, and trust_signal (unique to this area).\nKeep it 4 lines max.`,
          response_json_schema: {
            type: 'object',
            properties: {
              headline: { type: 'string' },
              subheadline: { type: 'string' },
              cta_text: { type: 'string' },
              trust_signal: { type: 'string' },
            },
            required: ['headline', 'subheadline', 'cta_text', 'trust_signal'],
          },
        });

        const variant = variantRes.data?.parsed || {};
        await base44.entities.LaunchCampaign.create({
          name: `Epoxy Funnel — ${cityName}, ${state}`,
          status: 'active',
          mode: 'autonomous',
          target_cities: [{ city: cityName, state, template_id: 'epoxy-funnel-v1', status: 'deployed' }],
          auto_deploy: true,
          description: `Auto-generated funnel variant. Headline: ${variant.headline || 'N/A'}`,
        });
        count++;
        setLaunched((prev) => [...prev, { city, variant, status: 'deployed' }]);
      } catch (e) {
        setLaunched((prev) => [...prev, { city, status: 'failed', error: e.message }]);
      }
    }
    setDeploying(false);
  };

  if (!result) return null;

  return (
    <div className="space-y-5">
      {/* Funnel Conversion */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Rocket className="h-5 w-5 text-amber-600" />
          <h3 className="text-sm font-bold text-stone-800">Step 3: Convert to Funnel Website</h3>
        </div>
        <p className="text-xs text-stone-600 mb-3">
          AI transforms the ingested component into a complete lead-generation funnel with hero, trust signals, gallery, pricing, lead form, FAQ, and CTA.
        </p>
        {!funnelCode && (
          <button onClick={convertToFunnel} disabled={converting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-stone-900 hover:bg-amber-400 disabled:opacity-50">
            {converting ? <><Loader2 className="h-4 w-4 animate-spin" /> Converting to funnel...</> : <><Rocket className="h-4 w-4" /> Convert to Funnel Website</>}
          </button>
        )}
        {funnelCode && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-2">
              <Check className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">Funnel website generated!</span>
            </div>
            <pre className="overflow-x-auto rounded-xl bg-stone-900 p-4 text-xs text-stone-200 max-h-96 overflow-y-auto">{funnelCode.slice(0, 3000)}{funnelCode.length > 3000 ? '\n... (truncated)' : ''}</pre>
            <button onClick={() => navigator.clipboard.writeText(funnelCode)} disabled={deploying}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700">Copy full funnel code</button>
          </div>
        )}
      </div>

      {/* Mass US Deployment */}
      {funnelCode && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-amber-600" />
            <h3 className="text-sm font-bold text-stone-800">Step 4: Mass Deploy Across the US</h3>
          </div>
          <p className="text-xs text-stone-600 mb-3">
            Generate strategically different funnel variants for cities across the United States. Each variant gets a unique headline, CTA, and trust signal tailored to its market.
          </p>

          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm font-semibold text-stone-700 shrink-0">Cities to deploy:</label>
            <select value={variantCount} onChange={(e) => setVariantCount(parseInt(e.target.value))}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm focus:border-amber-500 outline-none">
              <option value={10}>10 cities</option>
              <option value={25}>25 cities</option>
              <option value={50}>50 cities</option>
              <option value={100}>100 cities</option>
              <option value={US_CITIES.length}>All {US_CITIES.length} cities</option>
            </select>
            <span className="text-xs text-stone-400">({US_CITIES.length} available)</span>
          </div>

          <button onClick={massDeploy} disabled={deploying}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-bold text-white hover:from-amber-400 hover:to-amber-500 disabled:opacity-50">
            {deploying ? <><Loader2 className="h-4 w-4 animate-spin" /> Deploying... ({launched.length}/{variantCount})</> : <><Rocket className="h-4 w-4" /> Deploy {variantCount} Funnel Variants</>}
          </button>

          {launched.length > 0 && (
            <div className="mt-4 space-y-1.5 max-h-64 overflow-y-auto">
              {launched.map((l, i) => (
                <div key={i} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${l.status === 'deployed' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                  {l.status === 'deployed' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <MapPin className="h-3.5 w-3.5 text-red-500" />}
                  <span className="font-medium text-stone-700">{l.city}</span>
                  {l.variant?.headline && <span className="text-stone-500 truncate">— {l.variant.headline}</span>}
                  {l.error && <span className="text-red-500">— {l.error}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
    </div>
  );
}