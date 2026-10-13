import React from 'react';

/**
 * Cinematic hero visual — exact clone of website-launch-engine.vercel.app
 * Floating laptop showing Premier Roofing + 4 floating browser screens
 * (Real Estate, Landscape, Legal, Med Spa) with cyan orbit glow.
 */
export default function CinematicHeroVisual() {
  return (
    <div className="relative wle-stage" aria-label="Premium website template previews featured on a laptop and four floating screens">
      <a href="#templates" className="block wle-stage-link" aria-label="Explore premium template previews">
        <div className="relative wle-artboard">
          {/* Cyan orbit glows */}
          <div className="wle-cyan-orbit wle-cyan-orbit-one" aria-hidden="true" />
          <div className="wle-cyan-orbit wle-cyan-orbit-two" aria-hidden="true" />

          {/* Floating screen: Real Estate */}
          <div className="wle-float-screen wle-float-estate">
            <div className="wle-browser-strip"><span>● ● ●</span><small>REAL ESTATE</small></div>
            <div className="wle-float-photo wle-photo-estate">
              <div className="wle-float-navig">LUXE HOMES <i>Explore Homes</i></div>
              <div className="wle-float-head">Modern Homes.<br />Brighter Futures.</div>
              <div className="wle-float-button">View Collection →</div>
            </div>
          </div>

          {/* Floating screen: Landscape */}
          <div className="wle-float-screen wle-float-landscape">
            <div className="wle-browser-strip"><span>● ● ●</span><small>LANDSCAPE</small></div>
            <div className="wle-float-photo wle-photo-landscape">
              <div className="wle-float-navig">EVERGREEN <i>Get a Quote</i></div>
              <div className="wle-float-head">Transform Your<br />Outdoor Space</div>
              <div className="wle-float-button">Explore Our Work →</div>
            </div>
          </div>

          {/* Floating screen: Legal */}
          <div className="wle-float-screen wle-float-legal">
            <div className="wle-browser-strip"><span>● ● ●</span><small>LEGAL SERVICES</small></div>
            <div className="wle-float-photo wle-photo-legal">
              <div className="wle-float-navig">HARRISON LAW <i>Consultation</i></div>
              <div className="wle-float-head">Expert Legal<br />Representation</div>
              <div className="wle-float-button">Free Consultation →</div>
            </div>
          </div>

          {/* Floating screen: Med Spa */}
          <div className="wle-float-screen wle-float-spa">
            <div className="wle-browser-strip"><span>● ● ●</span><small>MED SPA</small></div>
            <div className="wle-float-photo wle-photo-spa">
              <div className="wle-float-navig">RADIANCE <i>Book Now</i></div>
              <div className="wle-float-head">Reveal Your<br />Natural Beauty</div>
              <div className="wle-float-button">Book Appointment →</div>
            </div>
          </div>

          {/* Laptop with Premier Roofing */}
          <div className="wle-laptop">
            <div className="wle-laptop-lid">
              <div className="wle-laptop-screen">
                <div className="wle-site-navbar">
                  <div>⌂ <strong>PREMIER ROOFING</strong></div>
                  <div className="wle-site-links">Home &nbsp; Services &nbsp; About &nbsp; Projects</div>
                  <span>Get a Free Estimate</span>
                </div>
                <div className="wle-roof-photo">
                  <div className="wle-roof-shade">
                    <small>ROOFING THAT BUILDS CONFIDENCE</small>
                    <h2>QUALITY ROOFING<br />BUILT TO LAST.</h2>
                    <p>Reliable. Local. Professional.</p>
                    <span className="wle-roof-cta">Get a Free Estimate →</span>
                  </div>
                </div>
                <div className="wle-site-services">
                  <span>⌂ &nbsp; Residential</span>
                  <span>▥ &nbsp; Commercial</span>
                  <span>⚒ &nbsp; Repairs</span>
                  <span>◈ &nbsp; Inspections</span>
                </div>
              </div>
            </div>
            <div className="wle-laptop-keyboard">
              <div className="wle-laptop-keys" />
              <div className="wle-laptop-trackpad" />
            </div>
            <div className="wle-laptop-lip" />
          </div>
        </div>
      </a>
    </div>
  );
}