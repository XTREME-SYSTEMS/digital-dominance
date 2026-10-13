import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Play, Pause, Volume2, Loader2, Mic } from 'lucide-react';

const VOICES = [
  { id: 'honey', label: 'Honey — Warm, Soft (Sol-like)', recommended: true },
  { id: 'river', label: 'River — Calm, Neutral' },
  { id: 'sunny', label: 'Sunny — Bright, Upbeat' },
  { id: 'storm', label: 'Storm — Formal, Authoritative' },
  { id: 'spark', label: 'Spark — Energetic, Quick' },
];

export default function EdenSkyeVoice() {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('honey');
  const [audioUrl, setAudioUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const generate = async () => {
    if (!text.trim() || generating) return;
    setGenerating(true);
    setAudioUrl(null);
    try {
      const res = await base44.functions.invoke('edenSkye', { action: 'generate_voice', text, voice });
      setAudioUrl(res.data?.audio_url);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0a1220] p-5">
      <div className="flex items-center gap-2">
        <Mic className="h-5 w-5 text-[#00a2ff]" />
        <h3 className="text-sm font-bold text-white">Eden Skye Voice Generation</h3>
        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-[#00a2ff] bg-[#00a2ff]/10 px-2 py-1 rounded-full">Sol-Like TTS</span>
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={4}
        placeholder="Type what Eden Skye should say..." className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#00a2ff] resize-none" />
      <div className="flex flex-wrap gap-2">
        {VOICES.map(v => (
          <button key={v.id} onClick={() => setVoice(v.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${voice === v.id ? 'bg-[#00a2ff] text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
            {v.label}
          </button>
        ))}
      </div>
      <button onClick={generate} disabled={generating || !text.trim()}
        className="w-full rounded-xl bg-[#00a2ff] py-3 text-sm font-bold text-white disabled:opacity-40 hover:bg-[#0090e0] transition flex items-center justify-center gap-2">
        {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Volume2 className="h-4 w-4" /> Generate Voice</>}
      </button>
      {audioUrl && (
        <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-4">
          <button onClick={togglePlay} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00a2ff] text-white hover:bg-[#0090e0]">
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <div className="flex-1">
            <p className="text-xs font-semibold text-white">Eden Skye — {voice}</p>
            <p className="text-[10px] text-white/40">Audio ready to play</p>
          </div>
          <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaying(false)} className="hidden" />
        </div>
      )}
    </div>
  );
}