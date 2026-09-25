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
    <div className="price-range-slider py-3 my-1">
      <div className="price-labels flex justify-between mb-3">
        <span className="price-label text-sm font-medium text-ink py-1 px-2 bg-surface rounded border border-line">Min: ${tempValues[0]}</span>
        <span className="price-label text-sm font-medium text-ink py-1 px-2 bg-surface rounded border border-line">Max: ${tempValues[1]}</span>
      </div>

      <div className="dual-range-container relative h-5 my-3">
        {/* Track background */}
        <div className="range-track absolute top-1/2 left-0 right-0 h-[2px] bg-line rounded-[1px] -translate-y-1/2">
          {/* Active range highlight */}
          <div
            className="range-track-active absolute h-full bg-ink rounded-[1px] [transition:all_120ms_ease]"
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
          className="range-input range-input-min z-[2] absolute top-0 left-0 w-full h-5 bg-transparent pointer-events-none appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-solid [&::-webkit-slider-thumb]:border-bg [&::-webkit-slider-thumb]:[box-shadow:0_0_0_1px_var(--border)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:[transition:transform_120ms_ease] [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-[2] [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-ink [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-solid [&::-moz-range-thumb]:border-bg [&::-moz-range-thumb]:[box-shadow:0_0_0_1px_var(--border)] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:[transition:transform_120ms_ease] [&::-moz-range-thumb]:relative [&::-moz-range-thumb]:z-[2] [&::-webkit-slider-thumb:hover]:scale-110 [&::-moz-range-thumb:hover]:scale-110 [&::-moz-range-track]:bg-transparent [&::-moz-range-track]:border-none [&::-moz-range-track]:h-[2px] [&::-webkit-slider-track]:bg-transparent [&::-webkit-slider-track]:border-none [&::-webkit-slider-track]:h-[2px]"
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
          className="range-input range-input-max z-[3] absolute top-0 left-0 w-full h-5 bg-transparent pointer-events-none appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-solid [&::-webkit-slider-thumb]:border-bg [&::-webkit-slider-thumb]:[box-shadow:0_0_0_1px_var(--border)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:[transition:transform_120ms_ease] [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-[2] [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-ink [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-solid [&::-moz-range-thumb]:border-bg [&::-moz-range-thumb]:[box-shadow:0_0_0_1px_var(--border)] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:[transition:transform_120ms_ease] [&::-moz-range-thumb]:relative [&::-moz-range-thumb]:z-[2] [&::-webkit-slider-thumb:hover]:scale-110 [&::-moz-range-thumb:hover]:scale-110 [&::-moz-range-track]:bg-transparent [&::-moz-range-track]:border-none [&::-moz-range-track]:h-[2px] [&::-webkit-slider-track]:bg-transparent [&::-webkit-slider-track]:border-none [&::-webkit-slider-track]:h-[2px]"
        />
      </div>

      <div className="price-range-display text-center mt-3.5 py-1.5 px-2.5 text-ink border border-line rounded font-medium text-13">
        ${tempValues[0]} - ${tempValues[1]}
      </div>
    </div>
  );
};

export default PriceRangeSlider;
