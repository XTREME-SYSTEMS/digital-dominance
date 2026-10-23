import React from "react";

/**
 * The header every admin page wears: an eyebrow that names the system, the page
 * title, an optional one-line explanation in plain language, and an optional
 * slot for page-level actions.
 *
 * Pages that used to invent their own heading block use this instead, so the
 * console reads as one product rather than many.
 */
export default function AdminPageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="adm-head">
      <div style={{ minWidth: 0 }}>
        {eyebrow ? <p className="adm-eyebrow">{eyebrow}</p> : null}
        <h1 className="adm-title">{title}</h1>
        {description ? <p className="adm-sub">{description}</p> : null}
      </div>
      {actions ? <div className="adm-head-actions">{actions}</div> : null}
    </header>
  );
}