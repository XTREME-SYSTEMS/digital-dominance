import React from 'react';

export default function FloatingTemplateScreen({ placement, industry, brand, action, headline, cta }) {
  return <div className={`wle-float-screen ${placement.screen}`}>
    <div className="wle-browser-strip"><span>● ● ●</span><small>{industry}</small></div>
    <div className={`wle-float-photo ${placement.photo}`}>
      <div className="wle-float-navig">{brand}<i>{action}</i></div>
      <div className="wle-float-head">{headline[0]}<br />{headline[1]}</div>
      <div className="wle-float-button">{cta} →</div>
    </div>
  </div>;
}