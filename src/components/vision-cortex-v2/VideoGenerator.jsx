import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { invokeLLM } from '@/lib/gateway';
import { Video, Loader2, Sparkles, TrendingUp, Play, Youtube } from 'lucide-react';

export default function VideoGenerator({ vision }) {
  const [loading, setLoading] = useState(null);
  const [trending, setTrending] = useState(null);
  const [videos, setVideos] = useState([]);
  const [strategy, setStrategy] = useState(null);
  const [error, setError] = useState(null);

  const findTrending = async () => {
    setLoading('trending');
    setError(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Search for the top trending YouTube videos related to this vision: "${vision}".
Identify the top 5 trending videos that are getting high engagement right now.
For each, describe the video concept, why it's trending, and what makes it viral.

Return JSON: { "trending_videos": [ { "title": string, "concept": string, "why_trending": string, "viral_elements": [string], "views_estimate": string } ] }`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            trending_videos: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, concept: { type: 'string' }, why_trending: { type: 'string' }, viral_elements: { type: 'array', items: { type: 'string' } }, views_estimate: { type: 'string' } } } },
          },
        },
      });
      setTrending(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  };

  const generateStrategy = async () => {
    setLoading('strategy');
    setError(null);
    try {
      const res = await invokeLLM({
        prompt: `Create a comprehensive YouTube video strategy for this vision: "${vision}".
Based on trending patterns, generate:
1. Content pillars (5 themes)
2. Video formats that work best
3. Posting schedule (frequency, best times)
4. Thumbnail strategy
5. Title/SEO strategy
6. Hook formulas for first 3 seconds
7. Call-to-action strategy
8. Monetization approach

Return JSON: {
  "content_pillars": [string], "video_formats": [string], "schedule": string,
  "thumbnail_strategy": string, "seo_strategy": string, "hook_formulas": [string],
  "cta_strategy": string, "monetization": string
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            content_pillars: { type: 'array', items: { type: 'string' } },
            video_formats: { type: 'array', items: { type: 'string' } },
            schedule: { type: 'string' },
            thumbnail_strategy: { type: 'string' },
            seo_strategy: { type: 'string' },
            hook_formulas: { type: 'array', items: { type: 'string' } },
            cta_strategy: { type: 'string' },
            monetization: { type: 'string' },
          },
        },
      });
      setStrategy(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  };

  const generateVideo = async (i) => {
    setLoading('video-' + i);
    setError(null);
    try {
      const res = await base44.integrations.Core.GenerateVideo({
        prompt: `Cinematic video for "${vision}" — professional, high-quality, engaging, modern style with dynamic transitions, suitable for YouTube, 6 seconds`,
        duration: 6,
      });
      setVideos((prev) => [...prev, { url: res.url, index: i }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  };

  const generateMass = async () => {
    setVideos([]);
    for (let i = 0; i < 5; i++) {
      await generateVideo(i);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-amber-500" />
          <h3 className="text-base font-black text-stone-900">Mass Video Generator — Trending Benchmark</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={findTrending} disabled={loading === 'trending'} className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-600 hover:border-amber-500 disabled:opacity-50">
            {loading === 'trending' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />}
            Find Trending
          </button>
          <button onClick={generateStrategy} disabled={loading === 'strategy'} className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-600 hover:border-amber-500 disabled:opacity-50">
            {loading === 'strategy' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Strategy
          </button>
          <button onClick={generateMass} disabled={!!loading} className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-50">
            {loading?.startsWith('video') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Youtube className="h-4 w-4" />}
            Generate 5 Videos
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {trending?.trending_videos?.length > 0 && (
        <div className="rounded-lg border border-stone-200 p-3">
          <p className="text-xs font-bold text-stone-500 mb-2 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> TRENDING BENCHMARK VIDEOS</p>
          <div className="space-y-1">
            {trending.trending_videos.map((v, i) => (
              <div key={i} className="rounded bg-stone-50 p-2">
                <p className="text-sm font-bold text-stone-700">{v.title}</p>
                <p className="text-xs text-stone-500">{v.concept}</p>
                <p className="text-[10px] text-amber-600 font-bold">Why trending: {v.why_trending}</p>
                {v.viral_elements?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">{v.viral_elements.map((e, j) => <span key={j} className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">{e}</span>)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {strategy && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-stone-200 p-3">
            <p className="text-xs font-bold text-stone-500 mb-1">CONTENT PILLARS</p>
            <ul className="list-disc list-inside text-xs text-stone-600 space-y-0.5">{strategy.content_pillars?.map((p, i) => <li key={i}>{p}</li>)}</ul>
          </div>
          <div className="rounded-lg border border-stone-200 p-3">
            <p className="text-xs font-bold text-stone-500 mb-1">HOOK FORMULAS</p>
            <ul className="list-disc list-inside text-xs text-stone-600 space-y-0.5">{strategy.hook_formulas?.map((h, i) => <li key={i}>{h}</li>)}</ul>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 col-span-2">
            <p className="text-xs font-bold text-amber-600 mb-0.5">SCHEDULE: {strategy.schedule}</p>
            <p className="text-xs font-bold text-emerald-600">MONETIZATION: {strategy.monetization}</p>
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {videos.map((v) => (
            <div key={v.index} className="rounded-lg border border-stone-200 overflow-hidden">
              <video src={v.url} controls className="w-full aspect-video" />
              <p className="text-[10px] text-stone-400 text-center py-0.5">Video {v.index + 1}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}