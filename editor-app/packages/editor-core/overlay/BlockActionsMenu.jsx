import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useIsoLayoutEffect } from '../lib/useIsoLayoutEffect.js';
import { OverlayIconBtn, IconMoreHorizontal } from './icons.jsx';

const GAP = 4;

const shortcut = (letter) => {
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  return mac ? `⌘${letter}` : `Ctrl+${letter}`;
};

export function BlockActionsMenu({ items, onOpenChange }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const setOpenState = (next) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  useIsoLayoutEffect(() => {
    if (!open) { setPos(null); return; }
    const btn = btnRef.current?.querySelector('button');
    const menu = menuRef.current;
    if (!btn || !menu) return;
    const r = btn.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const { offsetWidth: w, offsetHeight: h } = menu;
    const left = Math.min(Math.max(GAP, r.left), vw - GAP - w);
    const below = r.bottom + GAP + h <= vh;
    setPos({ left: Math.round(left), top: Math.round(below ? r.bottom + GAP : r.top - GAP - h) });
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpenState(false);
    const onDown = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      close();
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('blur', close);
    return () => {
      document.removeEventListener('mousedown', onDown, true);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('blur', close);
    };
  }, [open]);

  useEffect(() => () => { if (open) onOpenChange?.(false); }, [open]);

  if (!items.length) return null;

  const menu = open ? createPortal(
    <div
      ref={menuRef}
      role="menu"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        left: pos ? pos.left : 0,
        top: pos ? pos.top : 0,
        visibility: pos ? 'visible' : 'hidden',
        minWidth: 168,
        padding: 4,
        background: '#ffffff',
        border: '1px solid #D8D8D4',
        borderRadius: 6,
        boxShadow: '0 6px 20px rgb(0 0 0 / 0.14)',
        zIndex: 2147483646,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {items.map((item) => (
        <MenuItem
          key={item.label}
          item={item}
          onPick={() => { setOpenState(false); item.onClick(); }}
        />
      ))}
    </div>,
    document.body,
  ) : null;

  return (
    <div ref={btnRef} style={{ pointerEvents: 'auto' }} onMouseDown={(e) => e.stopPropagation()}>
      <OverlayIconBtn
        title={open ? undefined : 'More actions'}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenState(!open); }}
      >
        <IconMoreHorizontal />
      </OverlayIconBtn>
      {menu}
    </div>
  );
}

function MenuItem({ item, onPick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      role="menuitem"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPick(); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', height: 30, padding: '0 8px',
        background: hover ? '#F2F2EF' : 'transparent',
        color: hover ? '#0F4C5C' : '#242424',
        border: 'none', borderRadius: 4,
        fontSize: 12.5, fontWeight: 500, textAlign: 'left',
        cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      <span style={{ display: 'inline-flex', width: 14, justifyContent: 'center' }}>{item.icon}</span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.shortcut && (
        <span style={{ color: '#8A8A85', fontSize: 11, fontWeight: 400, marginLeft: 16 }}>{shortcut(item.shortcut)}</span>
      )}
    </button>
  );
}
