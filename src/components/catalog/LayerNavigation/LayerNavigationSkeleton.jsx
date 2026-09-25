import React from 'react';

export default function LayerNavigationSkeleton({ groupCount = 4, onHide }) {
  return (
    <div className="layer-navigation mb-6 max768:mb-3">
      <div className="layer-navigation-header flex justify-between items-center pb-3.5 max768:pb-2.5 border-b border-line [.plp-drawer-body_&]:hidden">
        <h3 className="m-0 text-sm font-medium tracking-[0.12em] uppercase text-ink">Filters</h3>
        {onHide && (
          <button
            className="hide-filters-btn cursor-pointer text-base py-1 px-2 rounded text-ink-2 [transition:color_120ms_ease] hover:text-ink hover:bg-surface"
            onClick={onHide}
            aria-label="Hide filters"
          >
            ✕
          </button>
        )}
      </div>
      <div className="pt-[18px]">
        {Array.from({ length: groupCount }).map((_, i) => (
          <div className="py-3.5 border-b border-line last:border-b-0" key={i}>
            <div className="sk-bar w-2/5 mb-3.5" />
            <div className="flex flex-col gap-2.5">
              <div className="sk-bar w-4/5" />
              <div className="sk-bar w-[65%]" />
              <div className="sk-bar w-3/4" />
              <div className="sk-bar w-[55%]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
