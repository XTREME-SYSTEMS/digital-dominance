import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import EdenSkyeHeader from '@/components/eden-skye/EdenSkyeHeader';
import EdenSkyeChat from '@/components/eden-skye/EdenSkyeChat';
import EdenSkyeVoice from '@/components/eden-skye/EdenSkyeVoice';
import EdenSkyeAvatar from '@/components/eden-skye/EdenSkyeAvatar';
import EdenSkyeMemory from '@/components/eden-skye/EdenSkyeMemory';
import EdenSkyeTwilio from '@/components/eden-skye/EdenSkyeTwilio';

export default function EdenSkye() {
  const [tab, setTab] = useState('chat');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('edenSkye', { action: 'status' });
      setStatus(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  return (
    <div className="min-h-screen bg-[#050508] p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <EdenSkyeHeader status={status} onTab={setTab} activeTab={tab} />
        {loading && <div className="text-center py-12 text-white/40">Loading Eden Skye...</div>}
        {!loading && tab === 'chat' && <EdenSkyeChat />}
        {!loading && tab === 'voice' && <EdenSkyeVoice />}
        {!loading && tab === 'avatar' && <EdenSkyeAvatar heygenConfigured={status?.heygen_configured} />}
        {!loading && tab === 'memory' && <EdenSkyeMemory />}
        {!loading && tab === 'twilio' && <EdenSkyeTwilio status={status} onRefresh={loadStatus} />}
      </div>
    </div>
  );
}