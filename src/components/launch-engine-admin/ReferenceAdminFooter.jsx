import React from "react";
import { Link } from "react-router-dom";

export default function ReferenceAdminFooter() {
  return (
    <>
      <div className="wle-notice"><b>Preview limitations:</b> This portal uses only static, non-sensitive placeholder states. No sign-in, lead delivery, client data, queue execution, billing, or release action is active. Production data must not be entered.</div>
      <div className="wle-footer">
        © 2026 Website Launch Engine · A Strategic Minds AI System · <Link to="/">Home</Link> · <a href="tel:+17722090266">Contact</a>
      </div>
    </>
  );
}