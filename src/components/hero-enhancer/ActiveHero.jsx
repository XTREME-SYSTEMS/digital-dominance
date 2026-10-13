import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Renders the active enhanced hero mockup if one exists in HeroMockup entity.
 * Falls back to the original LaunchHero if no enhanced hero is active.
 * This component wraps the hero section of the home page.
 */
export default function ActiveHero({ fallback, onBrowse }) {
  const [activeHero, setActiveHero] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    base44.entities.HeroMockup
      .filter({ is_active: true, status: 'applied' }, { limit: 1, fields: ['enhanced_html', 'title'] })
      .then((res) => {
        if (!cancelled && res.items?.length > 0 && res.items[0].enhanced_html) {
          setActiveHero(res.items[0]);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return fallback;

  if (activeHero) {
    return (
      <div className="relative z-30">
        <iframe
          srcDoc={activeHero.enhanced_html}
          title={activeHero.title || 'Enhanced Hero'}
          className="w-full border-0"
          style={{ minHeight: '400px' }}
          sandbox="allow-same-origin"
        />
      </div>
    );
  }

  return fallback;
}