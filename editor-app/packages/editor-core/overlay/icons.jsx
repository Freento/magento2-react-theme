import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useIsoLayoutEffect } from '../lib/useIsoLayoutEffect.js';

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
    bg: '#ffffff', border: '#B9B9B4', color: '#424242',
    bgHover: '#F2F2EF', borderHover: '#D8D8D4', colorHover: '#0F4C5C',
  },
  danger: {
    bg: '#ffffff', border: '#B9B9B4', color: '#424242',
    bgHover: '#fef2f2', borderHover: '#fca5a5', colorHover: '#dc2626',
  },
};

// A hover tip for the canvas overlay buttons. It is portalled to the document and
// fixed to the viewport — inside the block it would be clipped by the scrolling
// canvas and trapped in the block's stacking context. Once measured it is clamped
// to the viewport horizontally and flipped below the button when there is no room
// above, so the buttons hugging the canvas edges keep a readable tip.
const TIP_GAP = 6;

export function useHoverTip(title) {
  const [hover, setHover] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const [pos, setPos] = useState(null);
  const ref = useRef(null);
  const tipRef = useRef(null);

  useIsoLayoutEffect(() => {
    if (!hover || !title || !ref.current) {
      setAnchor(null);
      setPos(null);
      return;
    }
    const r = ref.current.getBoundingClientRect();
    setAnchor({ cx: r.left + r.width / 2, top: r.top, bottom: r.bottom });
  }, [hover, title]);

  useIsoLayoutEffect(() => {
    const el = tipRef.current;
    if (!anchor || !el) return;
    const { offsetWidth: w, offsetHeight: h } = el;
    const vw = document.documentElement.clientWidth;
    const half = w / 2;
    const minLeft = TIP_GAP + half;
    const maxLeft = Math.max(minLeft, vw - TIP_GAP - half);
    // Above the button by default; below it when the button sits at the very top.
    const above = anchor.top - TIP_GAP - h >= 0;
    setPos({
      left: Math.round(Math.min(Math.max(anchor.cx, minLeft), maxLeft)),
      top: Math.round(above ? anchor.top - TIP_GAP : anchor.bottom + TIP_GAP + h),
    });
  }, [anchor, title]);

  useEffect(() => {
    const hide = () => requestAnimationFrame(() => setHover(false));
    window.addEventListener('dragstart', hide, true);
    window.addEventListener('dragend', hide, true);
    return () => {
      window.removeEventListener('dragstart', hide, true);
      window.removeEventListener('dragend', hide, true);
    };
  }, []);

  const hoverProps = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    onBlur: () => setHover(false),
  };

  const tip = anchor ? createPortal(
    <span
      ref={tipRef}
      role="tooltip"
      style={{
        position: 'fixed',
        left: pos ? pos.left : anchor.cx,
        top: pos ? pos.top : anchor.top - TIP_GAP,
        transform: 'translate(-50%, -100%)',
        padding: '4px 8px',
        background: '#111111',
        color: '#ffffff',
        fontSize: 11,
        fontWeight: 500,
        lineHeight: 1.2,
        borderRadius: 4,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        // Hidden until measured, so it never flashes at the unclamped spot.
        visibility: pos ? 'visible' : 'hidden',
        zIndex: 2147483647,
        boxShadow: '0 2px 8px rgb(0 0 0 / 0.18)',
      }}
    >
      {title}
    </span>,
    document.body,
  ) : null;

  return { ref, hover, hoverProps, tip };
}

export function OverlayIconBtn({ title, onClick, onMouseDown, intent = 'neutral', children }) {
  const { ref, hover, hoverProps, tip } = useHoverTip(title);
  const p = ICON_PALETTE[intent];

  return (
    <button
      ref={ref}
      type="button"
      aria-label={title}
      onClick={onClick}
      onMouseDown={onMouseDown}
      {...hoverProps}
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
      {tip}
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
export const IconClipboard = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </svg>
);
export const IconClipboardPaste = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 2H9a1 1 0 0 0-1 1v2c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1Z" />
    <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2M16 4h2a2 2 0 0 1 2 2v2M11 14h10" />
    <path d="m17 10 4 4-4 4" />
  </svg>
);
export const IconScissors = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="6" cy="6" r="3" />
    <path d="M8.12 8.12 12 12" />
    <path d="M20 4 8.12 15.88" />
    <circle cx="6" cy="18" r="3" />
    <path d="M14.8 14.8 20 20" />
  </svg>
);
export const IconMoreHorizontal = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
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
export const IconLink = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);
export const IconListOrdered = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 12h11" />
    <path d="M10 18h11" />
    <path d="M10 6h11" />
    <path d="M4 10h2" />
    <path d="M4 6h1v4" />
    <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
  </svg>
);
export const IconListUnordered = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 6h12" />
    <path d="M9 12h12" />
    <path d="M9 18h12" />
    <circle cx="4" cy="6" r="1" fill="currentColor" />
    <circle cx="4" cy="12" r="1" fill="currentColor" />
    <circle cx="4" cy="18" r="1" fill="currentColor" />
  </svg>
);
export const IconTextGrow = () => (
  <svg width="21" height="16" viewBox="0 0 31 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 20 7.5 4 13 20" />
    <path d="M4.1 14h6.8" />
    <circle cx="17" cy="16.75" r="3.25" />
    <path d="M20.25 13v7" />
    <path d="M27 3v18" />
    <path d="m24.5 5.5 2.5-2.5 2.5 2.5" />
  </svg>
);
export const IconTextShrink = () => (
  <svg width="21" height="16" viewBox="0 0 31 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 20 7.5 4 13 20" />
    <path d="M4.1 14h6.8" />
    <circle cx="17" cy="16.75" r="3.25" />
    <path d="M20.25 13v7" />
    <path d="M27 3v18" />
    <path d="m24.5 18.5 2.5 2.5 2.5-2.5" />
  </svg>
);
export const IconChevronDown = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);
