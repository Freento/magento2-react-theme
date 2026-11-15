export const AXIS_LOCK = 8;

const COMMIT_RATIO = 0.15;
const COMMIT_MIN = 40;
const COMMIT_MAX = 80;

export const commitThreshold = (width) =>
  Math.min(COMMIT_MAX, Math.max(COMMIT_MIN, width * COMMIT_RATIO));

export const stepDirection = (from, to, length) => {
  if (to === (from + 1) % length) return 'next';
  if (to === (from - 1 + length) % length) return 'prev';
  return to > from ? 'next' : 'prev';
};

export const SLIDE_IN = { next: 'animate-gallery-in-next', prev: 'animate-gallery-in-prev' };
export const SLIDE_OUT = { next: 'animate-gallery-out-next', prev: 'animate-gallery-out-prev' };

export const stripSlots = (count, index) => {
  if (count < 2) return [{ idx: index, pos: 0 }];
  if (count === 2) return [{ idx: index, pos: 0 }, { idx: (index + 1) % 2, pos: 'side' }];
  return [
    { idx: (index - 1 + count) % count, pos: -1 },
    { idx: index, pos: 0 },
    { idx: (index + 1) % count, pos: 1 },
  ];
};

export const slotTransform = (pos) => {
  if (pos === 0) return undefined;
  if (pos === 'side') return 'translateX(calc(var(--swipe-side, 1) * 100%))';
  return `translateX(${pos * 100}%)`;
};
