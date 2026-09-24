import React, { useState } from 'react';
import { invokeLLM } from '@/lib/gateway';
import { PenLine, Loader2, Sparkles, MessageSquare, Mail, Video, Globe, Phone } from 'lucide-react';

const CHANNELS = [
  { id: 'social', name: 'Social Media', icon: MessageSquare, desc: 'Posts for all platforms' },
  { id: 'website', name: 'Website Content', icon: Globe, desc: 'Landing pages, about, blog' },
  { id: 'funnel', name: 'Funnel Copy', icon: PenLine, desc: 'Headlines, CTAs, sequences' },
  { id: 'sms', name: 'SMS Campaigns', icon: Phone, desc: 'Text message sequences' },
  { id: 'mms', name: 'MMS Campaigns', icon: MessageSquare, desc: 'Rich media messages' },
  { id: 'whatsapp', name: 'WhatsApp', icon: Phone, desc: 'WhatsApp business messages' },
  { id: 'voice', name: 'Voice Scripts', icon: Phone, desc: 'AI voice call scripts' },
  { id: 'email', name: 'Email Sequences', icon: Mail, desc: 'Nurture & broadcast emails' },
  { id: 'youtube', name: 'YouTube Scripts', icon: Video, desc: 'Video scripts & descriptions' },
];

export default function ContentGenerator({ vision, brand }) {
  const [loading, setLoading] = useState(null);
  const [content, setContent] = useState({});
  const [error, setError] = useState(null);

  const generate = async (channel) => {
    setLoading(channel.id);
    setError(null);
    try {
      const brandContext = brand ? `Brand: ${brand.name}, Voice: ${brand.voice || 'professional'}, Colors: ${brand.colors?.map((c) => c.hex).join(', ')}` : '';
      const res = await invokeLLM({
        prompt: `Generate complete marketing content for the "${channel.name}" channel.
Vision: "${vision}"
${brandContext}

Generate 5 pieces of high-converting content for this channel. Include hooks, body, CTAs, and any platform-specific formatting.

Return JSON: { "items": [ { "title": string, "content": string, "cta": string } ] }`,
        response_json_schema: {
          type: 'object',
          properties: {
            items: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' }, cta: { type: 'string' } } } },
          },
        },
      });
      setContent((prev) => ({ ...prev, [channel.id]: res.items || [] }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  };

  const generateAll = async () => {
    for (const ch of CHANNELS) {
      await generate(ch);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PenLine className="h-5 w-5 text-amber-500" />
          <h3 className="text-base font-black text-stone-900">Full Content Generator — All Channels</h3>
        </div>
        <button onClick={generateAll} disabled={!!loading} className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? `Generating ${loading}...` : 'Generate All Channels'}
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
        {CHANNELS.map((ch) => {
          const Icon = ch.icon;
          const hasContent = content[ch.id]?.length > 0;
          return (
            <button key={ch.id} onClick={() => generate(ch)} disabled={loading === ch.id} className={`rounded-lg border-2 p-2 text-center transition disabled:opacity-50 ${hasContent ? 'border-green-300 bg-green-50' : 'border-stone-200 bg-white hover:border-amber-400'}`}>
              <Icon className="h-5 w-5 mx-auto mb-1 text-amber-500" />
              <p className="text-[10px] font-bold text-stone-700">{ch.name}</p>
              {loading === ch.id && <Loader2 className="h-3 w-3 animate-spin mx-auto mt-1" />}
              {hasContent && <span className="text-[9px] text-green-600 font-bold">{content[ch.id].length} items</span>}
            </button>
          );
        })}
      </div>

      {Object.keys(content).length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {Object.entries(content).map(([chId, items]) => {
            const ch = CHANNELS.find((c) => c.id === chId);
            if (!ch || !items.length) return null;
            return (
              <div key={chId} className="rounded-lg border border-stone-200 p-3">
                <p className="text-xs font-bold text-amber-600 mb-1">{ch.name} ({items.length} items)</p>
                <div className="space-y-1">
                  {items.slice(0, 2).map((item, i) => (
                    <div key={i} className="text-xs text-stone-600 bg-stone-50 rounded p-2">
                      <p className="font-bold text-stone-700">{item.title}</p>
                      <p className="text-stone-500 line-clamp-2">{item.content}</p>
                      {item.cta && <p className="text-amber-600 font-bold mt-0.5">CTA: {item.cta}</p>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}