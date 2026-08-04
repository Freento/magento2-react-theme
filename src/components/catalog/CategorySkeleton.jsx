import React from 'react';

export default function CategorySkeleton({ count = 12 }) {
  return (
    <div className="category-page sk-plp">
      <div className="sk-plp-title sk-bar" />
      <div className="sk-plp-grid">
        {Array.from({ length: count }).map((_, i) => (
          <div className="sk-plp-card" key={i}>
            <div className="sk-img" />
            <div className="sk-bar sk-bar--md" />
            <div className="sk-bar sk-bar--sm" />
            <div className="sk-bar sk-bar--xs" />
          </div>
        ))}
      </div>
    </div>
  );
}
