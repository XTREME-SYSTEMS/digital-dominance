import React from "react";
import { Link } from "react-router-dom";

export default function ReferenceAdminNextPanel() {
  return (
    <aside className="wle-panel">
      <h2>What happens next?</h2>
      <p>Enable verified account authentication, tenant permissions, and durable data connections before this portal processes real customer information.</p>
      <Link to="/" className="wle-action">Explore Website Templates →</Link>
      <a href="tel:+17722090266" className="wle-action secondary">Call (772) 209-0266 ↗</a>
    </aside>
  );
}