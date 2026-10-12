import React from "react";
import { Link } from "react-router-dom";

export default function ReferenceAdminHeader({ isReference }) {
  return (
    <header className="wle-top">
      <div className="wle-top-left">Admin Control Center</div>
      <div className="wle-top-actions">
        <Link to="/" className="wle-help">View public site ↗</Link>
        <span className="wle-pill">{isReference ? "PREVIEW ONLY" : "ADMIN WORKSPACE"}</span>
      </div>
    </header>
  );
}