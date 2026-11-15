import { useCallback, useLayoutEffect, useRef } from 'react';
import { AXIS_LOCK, commitThreshold } from '../helpers/gallerySwipe';

const FLICK_SPEED = 0.35;
const SETTLE_MS = 220;
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

export default function useSwipeStrip({ count, index, onSelect, enabled = true }) {
  const stripRef = useRef(null);
  const gesture = useRef(null);
  const frame = useRef(0);
  const settling = useRef(false);
  const swiped = useRef(false);
  const landedOn = useRef(null);
  const resetOnIndex = useRef(false);

  const setX = (x, animate) => {
    const el = stripRef.current;
    if (!el) return;
    el.style.transition = animate ? `transform ${SETTLE_MS}ms ${EASE}` : 'none';
    if (x) el.style.setProperty('--swipe-side', x < 0 ? '1' : '-1');
    el.style.transform = x ? `translate3d(${x}px, 0, 0)` : '';
  };

  useLayoutEffect(() => {
    if (!resetOnIndex.current) return;
    resetOnIndex.current = false;
    setX(0, false);
  }, [index]);

  const onPointerDown = useCallback((e) => {
    swiped.current = false;
    landedOn.current = null;
    if (!enabled || !e.isPrimary || count < 2 || settling.current) {
      gesture.current = null;
      return;
    }
    gesture.current = {
      x: e.clientX,
      y: e.clientY,
      dx: 0,
      axis: null,
      width: e.currentTarget.clientWidth || window.innerWidth,
      samples: [{ x: e.clientX, t: e.timeStamp }],
    };
  }, [count, enabled]);

  const onPointerMove = useCallback((e) => {
    const g = gesture.current;
    if (!g || !e.isPrimary) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.axis) {
      if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) return;
      if (Math.abs(dy) >= Math.abs(dx)) { gesture.current = null; return; }
      g.axis = 'x';
      try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { g.uncaptured = true; }
    }
    g.dx = dx;
    g.samples.push({ x: e.clientX, t: e.timeStamp });
    if (g.samples.length > 5) g.samples.shift();
    if (!frame.current) {
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        if (gesture.current) setX(gesture.current.dx, false);
      });
    }
  }, []);

  const finish = useCallback((commitAllowed) => {
    const g = gesture.current;
    gesture.current = null;
    if (frame.current) { cancelAnimationFrame(frame.current); frame.current = 0; }
    if (!g || g.axis !== 'x') return;
    swiped.current = true;
    const first = g.samples[0];
    const last = g.samples[g.samples.length - 1];
    const speed = last.t > first.t ? (last.x - first.x) / (last.t - first.t) : 0;
    const direction = g.dx < 0 ? 1 : -1;
    const flicked = Math.abs(speed) >= FLICK_SPEED && Math.sign(speed) === -direction;
    const commit = commitAllowed && (Math.abs(g.dx) >= commitThreshold(g.width) || flicked);
    const target = commit ? -direction * g.width : 0;
    const el = stripRef.current;
    if (!el) return;
    settling.current = true;
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      el.removeEventListener('transitionend', onEnd);
      clearTimeout(fallback);
      settling.current = false;
      if (commit) {
        const next = (index + direction + count) % count;
        landedOn.current = next;
        resetOnIndex.current = true;
        onSelect(next);
      } else {
        setX(0, false);
      }
    };
    const onEnd = (ev) => { if (ev.target === el && ev.propertyName === 'transform') done(); };
    const fallback = setTimeout(done, SETTLE_MS + 80);
    el.addEventListener('transitionend', onEnd);
    setX(target, true);
  }, [count, index, onSelect]);

  const onPointerUp = useCallback(() => finish(true), [finish]);
  const onPointerCancel = useCallback(() => finish(false), [finish]);

  const consumeClick = useCallback(() => {
    const was = swiped.current;
    swiped.current = false;
    return was;
  }, []);

  return {
    stripRef,
    consumeClick,
    landedOn: landedOn.current,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  };
}
