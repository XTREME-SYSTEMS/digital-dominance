import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Video, Loader2, RefreshCw, Play, Sparkles } from 'lucide-react';

const EDEN_IMAGE = 'https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/fe76c662d_image.png';

export default function EdenSkyeAvatar({ heygenConfigured }) {
  const [text, setText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [videoId, setVideoId] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState(null);

  const generate = async () => {
    if (!text.trim() || generating) return;
    setGenerating(true);
    setVideoUrl(null);
    setVideoId(null);
    try {
      const res = await base44.functions.invoke('edenSkye', { action: 'generate_avatar', text });
      setVideoId(res.data?.video_id);
      setStatus(res.data?.status);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const checkStatus = async () => {
    if (!videoId || checking) return;
    setChecking(true);
    try {
      const res = await base44.functions.invoke('edenSkye', { action: 'check_avatar', video_id: videoId });
      setStatus(res.data?.status);
      if (res.data?.video_url) setVideoUrl(res.data.video_url);
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0a1220] p-5">
      <div className="flex items-center gap-2">
        <Video className="h-5 w-5 text-[#00a2ff]" />
        <h3 className="text-sm font-bold text-white">HeyGen AI Talking Avatar</h3>
        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-[#00a2ff] bg-[#00a2ff]/10 px-2 py-1 rounded-full">Highest Tech</span>
      </div>
      <div className="flex gap-4">
        <img src={EDEN_IMAGE} alt="Eden Skye Avatar" className="h-28 w-28 rounded-xl object-cover border border-[#00a2ff]/30" />
        <div className="flex-1 space-y-2">
          <p className="text-xs text-white/60">Generate a talking-head video of Eden Skye speaking your text. Powered by HeyGen's photorealistic AI avatar technology.</p>
          {!heygenConfigured && (
            <p className="text-[10px] text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">HEYGEN_API_KEY required — add it in Secrets to enable avatar video generation.</p>
          )}
        </div>
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
        placeholder="Type what Eden Skye's avatar should say..." className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#00a2ff] resize-none" />
      <button onClick={generate} disabled={generating || !text.trim() || !heygenConfigured}
        className="w-full rounded-xl bg-[#00a2ff] py-3 text-sm font-bold text-white disabled:opacity-40 hover:bg-[#0090e0] transition flex items-center justify-center gap-2">
        {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating Avatar Video...</> : <><Sparkles className="h-4 w-4" /> Generate Avatar Video</>}
      </button>
      {videoId && (
        <div className="space-y-3 rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Video ID: {videoId.slice(0, 12)}...</span>
            <button onClick={checkStatus} disabled={checking}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20 disabled:opacity-40">
              {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Check Status
            </button>
          </div>
          <p className="text-xs text-white/50">Status: <span className="font-semibold text-[#00a2ff]">{status || 'pending'}</span></p>
          {videoUrl && (
            <div className="space-y-2">
              <video src={videoUrl} controls className="w-full rounded-xl border border-white/10" />
              <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-[#00a2ff] hover:underline">
                <Play className="h-3.5 w-3.5" /> Open in new tab
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}