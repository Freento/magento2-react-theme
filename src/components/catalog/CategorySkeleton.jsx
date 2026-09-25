import React from 'react';

export default function CategorySkeleton({ count = 12 }) {
  return (
    <div className="category-page pt-10 max768:pt-4 pb-6">
      <div className="sk-bar h-9 w-[35%] mb-7 max768:h-7 max768:mb-[18px]" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-y-7 gap-x-5 max768:grid-cols-2 max768:gap-y-5 max768:gap-x-3.5">
        {Array.from({ length: count }).map((_, i) => (
          <div className="flex flex-col" key={i}>
            <div className="sk-img aspect-[3/4] w-full mb-3" />
            <div className="sk-bar sk-bar--md w-3/4" />
            <div className="sk-bar sk-bar--sm w-2/5" />
            <div className="sk-bar sk-bar--xs w-1/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
