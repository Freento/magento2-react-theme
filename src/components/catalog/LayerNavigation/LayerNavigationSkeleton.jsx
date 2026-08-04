import React from 'react';

export default function LayerNavigationSkeleton({ groupCount = 4, onHide }) {
  return (
    <div className="layer-navigation">
      <div className="layer-navigation-header">
        <h3>Filters</h3>
        {onHide && (
          <button
            className="hide-filters-btn"
            onClick={onHide}
            aria-label="Hide filters"
          >
            ✕
          </button>
        )}
      </div>
      <div className="sk-ln">
        {Array.from({ length: groupCount }).map((_, i) => (
          <div className="sk-ln-group" key={i}>
            <div className="sk-bar sk-ln-title" />
            <div className="sk-ln-options">
              <div className="sk-bar sk-ln-opt" />
              <div className="sk-bar sk-ln-opt" />
              <div className="sk-bar sk-ln-opt" />
              <div className="sk-bar sk-ln-opt" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
