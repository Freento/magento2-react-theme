import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/ui/NotFound.less';

export default function NotFound() {
  return (
    <section className="nf-section" aria-labelledby="nf-heading">
      <span className="nf-eyebrow">Error · 404</span>
      <h1 id="nf-heading" className="nf-title">This page took a wrong turn.</h1>
      <p className="nf-text">
        The address looks fine but nothing's here. The page may have moved,
        the link may be stale, or it never existed in the first place.
      </p>
      <div className="nf-actions">
        <Link to="/" className="nf-btn nf-btn--primary">Back to home</Link>
      </div>
    </section>
  );
}
