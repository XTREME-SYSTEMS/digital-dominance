import React from "react";
import { Diamond } from "lucide-react";

export default function ReferenceAdminHero({ view }) {
  return (
    <div className="wle-hero">
      <div>
        <div className="wle-eyebrow">WORKSPACE FOUNDATION · V1</div>
        <h1 id="viewTitle">{view.title}</h1>
        <p id="viewDescription">{view.description}</p>
      </div>
      <div className="wle-hero-badge"><Diamond aria-hidden="true" /> DEVELOPMENT PREVIEW</div>
    </div>
  );
}