import React from 'react';

const CarouselIndicators = ({ total, current, onSelect }) => {
  if (total <= 1) return null;

  return (
    <div className="ci-dots flex justify-center flex-wrap gap-0 max900:gap-2 pt-5">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          type="button"
          className={`ci-dot w-6 h-6 p-2 border-0 rounded-pill cursor-pointer bg-clip-content [transition:background-color_200ms_ease] ${
            i === current ? 'bg-ink' : 'bg-line-strong'
          }`}
          aria-label={`Slide ${i + 1}`}
          aria-current={i === current}
          onClick={() => onSelect?.(i)}
        />
      ))}
    </div>
  );
};

export default CarouselIndicators;
