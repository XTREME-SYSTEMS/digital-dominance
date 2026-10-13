import React from 'react';
import FloatingTemplateScreen from '@/components/launch-engine/FloatingTemplateScreen';
import RoofingLaptop from '@/components/launch-engine/RoofingLaptop';

const screens = [
  { placement: { screen: 'wle-float-estate', photo: 'wle-photo-estate' }, industry: 'REAL ESTATE', brand: 'LUXE HOMES', action: 'Explore Homes', headline: ['Modern Homes.', 'Brighter Futures.'], cta: 'View Collection' },
  { placement: { screen: 'wle-float-landscape', photo: 'wle-photo-landscape' }, industry: 'LANDSCAPE', brand: 'EVERGREEN', action: 'Get a Quote', headline: ['Transform Your', 'Outdoor Space'], cta: 'Explore Our Work' },
  { placement: { screen: 'wle-float-legal', photo: 'wle-photo-legal' }, industry: 'LEGAL SERVICES', brand: 'HARRISON LAW', action: 'Consultation', headline: ['Expert Legal', 'Representation'], cta: 'Free Consultation' },
  { placement: { screen: 'wle-float-spa', photo: 'wle-photo-spa' }, industry: 'MED SPA', brand: 'RADIANCE', action: 'Book Now', headline: ['Reveal Your', 'Natural Beauty'], cta: 'Book Appointment' },
];

export default function CinematicHeroVisual() {
  return <div className="wle-stage" aria-label="Premium website template previews featured on a laptop and four floating screens">
    <a href="#templates" className="wle-stage-link" aria-label="Explore premium roofing, real estate, landscaping, legal and med spa template previews">
      <div className="wle-artboard" aria-hidden="true">
        <div className="wle-cyan-orbit wle-cyan-orbit-one" />
        <div className="wle-cyan-orbit wle-cyan-orbit-two" />
        {screens.map(screen => <FloatingTemplateScreen key={screen.industry} {...screen} />)}
        <RoofingLaptop />
      </div>
    </a>
  </div>;
}