import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { OverlayIconBtn, IconMinus, IconPlus } from '../overlay/icons.jsx';

export function GridSizeControls({ block, onUpdateProp, anchorRef, onEnter, onLeave }) {
  const cols = Math.max(1, Number(block.props?.columns) || 1);
  const rows = Math.max(1, Number(block.props?.rows) || 1);
  const boxRef = useRef(null);
  const [pos, setPos] = useState(null);
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };

  useLayoutEffect(() => {
    const viewportOf = (el) => {
      let host = null;
      for (let p = el.parentElement; p; p = p.parentElement) {
        const oy = getComputedStyle(p).overflowY;
        if (oy === 'auto' || oy === 'scroll') { host = p; break; }
      }
      if (!host) return { top: 0, bottom: window.innerHeight, left: 0, right: window.innerWidth };
      const r = host.getBoundingClientRect();
      let top = r.top;
      for (const child of host.children) {
        const cs = getComputedStyle(child);
        if (cs.position !== 'sticky' && cs.position !== 'fixed') continue;
        const cr = child.getBoundingClientRect();
        if (cr.top <= r.top + 1 && cr.bottom > top) top = cr.bottom;
      }
      return { top, bottom: r.bottom, left: r.left, right: r.right };
    };
    const place = () => {
      const anchor = anchorRef?.current;
      const box = boxRef.current;
      if (!anchor || !box) return;
      const r = anchor.getBoundingClientRect();
      const view = viewportOf(anchor);
      if (r.bottom < view.top || r.top > view.bottom) {
        setPos(null);
        return;
      }
      const w = box.offsetWidth;
      const h = box.offsetHeight;
      const left = Math.max(view.left + 4, Math.min(r.right - 78 - w, view.right - w - 4));
      const above = r.top - h - 4;
      const top = above < view.top + 4
        ? Math.max(view.top + 4, Math.min(r.top + 4, view.bottom - h - 4))
        : above;
      setPos((prev) => (prev && prev.left === left && prev.top === top ? prev : { left, top }));
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [anchorRef, cols, rows]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={boxRef}
      style={{
        position: 'fixed',
        left: pos ? pos.left : -9999,
        top: pos ? pos.top : -9999,
        visibility: pos ? 'visible' : 'hidden',
        display: 'flex', gap: 4, padding: 2,
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid #B9B9B4',
        borderRadius: 4,
        whiteSpace: 'nowrap',
        zIndex: 2147483647,
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onMouseDown={stop}
    >
      <span style={{ fontSize: 11, color: '#424242', alignSelf: 'center', padding: '0 4px' }}>
        cols {cols}
      </span>
      <OverlayIconBtn
        title="Remove column"
        onMouseDown={stop}
        onClick={(e) => { stop(e); if (cols > 1) onUpdateProp(block.id, 'columns', cols - 1); }}
      ><IconMinus /></OverlayIconBtn>
      <OverlayIconBtn
        title="Add column"
        onMouseDown={stop}
        onClick={(e) => { stop(e); onUpdateProp(block.id, 'columns', cols + 1); }}
      ><IconPlus /></OverlayIconBtn>
      <span style={{ fontSize: 11, color: '#424242', alignSelf: 'center', padding: '0 4px' }}>
        rows {rows}
      </span>
      <OverlayIconBtn
        title="Remove row"
        onMouseDown={stop}
        onClick={(e) => { stop(e); if (rows > 1) onUpdateProp(block.id, 'rows', rows - 1); }}
      ><IconMinus /></OverlayIconBtn>
      <OverlayIconBtn
        title="Add row"
        onMouseDown={stop}
        onClick={(e) => { stop(e); onUpdateProp(block.id, 'rows', rows + 1); }}
      ><IconPlus /></OverlayIconBtn>
    </div>,
    document.body
  );
}
