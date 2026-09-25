import React from 'react';

export default function ProductSkeleton() {
  return (
    <div className="product-detail-content grid grid-cols-2 gap-8 py-6 max900:grid-cols-1 max900:gap-5">
      <div className="flex flex-col gap-3">
        <div className="sk-img aspect-square w-full max900:aspect-[4/5]" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="sk-img aspect-square" key={i} />
          ))}
        </div>
      </div>
      <div className="pt-2">
        <div className="sk-bar sk-bar--lg" />
        <div className="sk-bar sk-bar--md" />
        <div className="sk-bar sk-bar--md" />
        <div className="sk-bar sk-bar--sm" />
        <div className="flex gap-2 mt-5 mb-3.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div className="sk-img w-8 h-8 rounded-pill" key={i} />
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
