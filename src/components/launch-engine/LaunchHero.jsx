import React from 'react';
import LaunchHeroNav from '@/components/launch-engine/LaunchHeroNav';
import LaunchHeroCopy from '@/components/launch-engine/LaunchHeroCopy';
import CinematicHeroVisual from '@/components/launch-engine/CinematicHeroVisual';
import '@/components/launch-engine/cinematicHero.css';

export default function LaunchHero({ onBrowse }) {
  return <header className="wle-home-hero font-launch-home">
    <LaunchHeroNav />
    <section className="wle-hero-cinematic" aria-labelledby="cinematicHeroTitle">
      <div className="wle-sunset-glow" aria-hidden="true" />
      <div className="wle-hero-in">
        <LaunchHeroCopy onBrowse={onBrowse} />
        <CinematicHeroVisual />
      </div>
    </section>
  </header>;
}