import React, { useState, useEffect } from 'react';

const PriceRangeSlider = ({ min, max, values, onChange, onChangeCommitted, currentFilter }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [tempValues, setTempValues] = useState(values);

  useEffect(() => {
    if (!isDragging) {
      if (currentFilter && typeof currentFilter === 'object' && currentFilter.from && currentFilter.to) {
        setTempValues([Number(currentFilter.from), Number(currentFilter.to)]);
      } else {
        setTempValues([min, max]);
      }
    }
  }, [currentFilter, min, max, isDragging]);

  const handleMinChange = (e) => {
    const newMin = Math.min(Number(e.target.value), tempValues[1] - 1);
    const newValues = [newMin, tempValues[1]];
    setTempValues(newValues);
    onChange(newValues);
  };

  const handleMaxChange = (e) => {
    const newMax = Math.max(Number(e.target.value), tempValues[0] + 1);
    const newValues = [tempValues[0], newMax];
    setTempValues(newValues);
    onChange(newValues);
  };

  const handleCommit = () => {
    setIsDragging(false);
    if (tempValues[0] !== min || tempValues[1] !== max) {
      onChangeCommitted(tempValues);
    }
  };

  const handleStartDrag = () => {
    setIsDragging(true);
  };

  // Calculate positions for the range track
  const minPercent = ((tempValues[0] - min) / (max - min)) * 100;
  const maxPercent = ((tempValues[1] - min) / (max - min)) * 100;

  return (
    <div className="price-range-slider">
      <div className="price-labels">
        <span className="price-label">Min: ${tempValues[0]}</span>
        <span className="price-label">Max: ${tempValues[1]}</span>
      </div>

      <div className="dual-range-container">
        {/* Track background */}
        <div className="range-track">
          {/* Active range highlight */}
          <div
            className="range-track-active"
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`
            }}
          />
        </div>

        {/* Min range input */}
        <input
          type="range"
          min={min}
          max={max}
          value={tempValues[0]}
          onChange={handleMinChange}
          onMouseDown={handleStartDrag}
          onMouseUp={handleCommit}
          onTouchStart={handleStartDrag}
          onTouchEnd={handleCommit}
          className="range-input range-input-min"
        />

        {/* Max range input */}
        <input
          type="range"
          min={min}
          max={max}
          value={tempValues[1]}
          onChange={handleMaxChange}
          onMouseDown={handleStartDrag}
          onMouseUp={handleCommit}
          onTouchStart={handleStartDrag}
          onTouchEnd={handleCommit}
          className="range-input range-input-max"
        />
      </div>

      <div className="price-range-display">
        ${tempValues[0]} - ${tempValues[1]}
      </div>
    </div>
  );
};

export default PriceRangeSlider;
