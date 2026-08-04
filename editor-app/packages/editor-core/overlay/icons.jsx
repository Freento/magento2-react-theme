import { useState } from 'react';

export function DropIndicator({ active }) {
  if (!active) return null;
  return (
    <div style={{
      height: 8,
      background: '#0F4C5C',
      border: 'none',
      borderRadius: 3,
      margin: '6px 0',
      transition: 'all 0.15s',
    }} />
  );
}

export const ICON_PALETTE = {
  neutral: {
    bg: '#ffffff', border: '#e5e7eb', color: '#525252',
    bgHover: '#F2F2EF', borderHover: '#D8D8D4', colorHover: '#0F4C5C',
  },
  danger: {
    bg: '#ffffff', border: '#e5e7eb', color: '#525252',
    bgHover: '#fef2f2', borderHover: '#fca5a5', colorHover: '#dc2626',
  },
};

export function OverlayIconBtn({ title, onClick, onMouseDown, intent = 'neutral', children }) {
  const [hover, setHover] = useState(false);
  const p = ICON_PALETTE[intent];
  return (
    <button
      type="button"
      data-tooltip={title}
      aria-label={title}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 22, height: 22, padding: 0,
        background: hover ? p.bgHover : p.bg,
        border: `1px solid ${hover ? p.borderHover : p.border}`,
        color: hover ? p.colorHover : p.color,
        borderRadius: 4,
        cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.12s',
      }}
    >
      {children}
    </button>
  );
}

export const IconMinus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14" />
  </svg>
);
export const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);
export const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);
export const IconCopy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect width="14" height="14" x="8" y="8" rx="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);
export const IconGripVertical = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="5" r="1" />
    <circle cx="9" cy="19" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="5" r="1" />
    <circle cx="15" cy="19" r="1" />
  </svg>
);
