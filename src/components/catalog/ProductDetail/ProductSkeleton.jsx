import React from 'react';

export default function ProductSkeleton() {
  return (
    <div className="product-detail-content sk-pdp">
      <div className="sk-pdp-gallery">
        <div className="sk-img sk-pdp-main" />
        <div className="sk-pdp-thumbs">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="sk-img sk-pdp-thumb" key={i} />
          ))}
        </div>
      </div>
      <div className="sk-pdp-info">
        <div className="sk-bar sk-bar--lg" />
        <div className="sk-bar sk-bar--md" />
        <div className="sk-bar sk-bar--md" />
        <div className="sk-bar sk-bar--sm" />
        <div className="sk-pdp-swatches">
          {Array.from({ length: 5 }).map((_, i) => (
            <div className="sk-pdp-swatch" key={i} />
          ))}
        </div>
        <div className="sk-bar sk-bar--cta" />
        <div className="sk-bar sk-bar--xs" />
        <div className="sk-bar sk-bar--xs" />
        <div className="sk-bar sk-bar--xs" />
      </div>
    </div>
  );
}
