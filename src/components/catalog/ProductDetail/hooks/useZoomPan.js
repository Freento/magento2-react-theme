import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const MAX_SCALE = 4;
const STEP = 1.4;
const EPS = 0.001;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export default function useZoomPan({ active, resetKey }) {
  const frameRef = useRef(null);
  const [natural, setNatural] = useState(null);
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const fitScale = natural && frame.w && frame.h
    ? Math.min(1, frame.w / natural.w, frame.h / natural.h)
    : 1;

  const overflow = natural
    ? {
      x: Math.max(0, (natural.w * scale - frame.w) / 2),
      y: Math.max(0, (natural.h * scale - frame.h) / 2),
    }
    : { x: 0, y: 0 };
  const canPan = overflow.x > 0 || overflow.y > 0;
  const isFitted = scale <= fitScale + EPS;

  const live = useRef({});
  live.current = { scale, offset, fitScale, natural, frame, overflow };

  const clampOffset = useCallback((next, ov) => ({
    x: clamp(next.x, -ov.x, ov.x),
    y: clamp(next.y, -ov.y, ov.y),
  }), []);

  const zoomAt = useCallback((nextScale, clientX, clientY) => {
    const { scale: cur, offset: off, fitScale: fit, natural: nat, frame: fr } = live.current;
    if (!nat) return;
    const target = clamp(nextScale, fit, MAX_SCALE);
    if (Math.abs(target - cur) < EPS) return;

    const rect = frameRef.current?.getBoundingClientRect();
    const cx = rect ? clientX - (rect.left + rect.width / 2) : 0;
    const cy = rect ? clientY - (rect.top + rect.height / 2) : 0;
    const px = (cx - off.x) / cur;
    const py = (cy - off.y) / cur;
    const nextOffset = { x: cx - px * target, y: cy - py * target };

    const ov = {
      x: Math.max(0, (nat.w * target - fr.w) / 2),
      y: Math.max(0, (nat.h * target - fr.h) / 2),
    };
    setScale(target);
    setOffset(clampOffset(nextOffset, ov));
  }, [clampOffset]);

  const centre = () => {
    const rect = frameRef.current?.getBoundingClientRect();
    return rect
      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      : { x: 0, y: 0 };
  };

  const zoomIn = useCallback(() => {
    const c = centre();
    zoomAt(live.current.scale * STEP, c.x, c.y);
  }, [zoomAt]);

  const zoomOut = useCallback(() => {
    const c = centre();
    zoomAt(live.current.scale / STEP, c.x, c.y);
  }, [zoomAt]);

  const reset = useCallback(() => {
    setScale(live.current.fitScale);
    setOffset({ x: 0, y: 0 });
  }, []);
  const toggleZoom = useCallback((clientX, clientY) => {
    const { scale: cur, fitScale: fit } = live.current;
    const c = centre();
    const x = clientX ?? c.x;
    const y = clientY ?? c.y;
    if (cur > fit + EPS) {
      reset();
      return;
    }
    zoomAt(fit >= 1 - EPS ? fit * STEP : 1, x, y);
  }, [reset, zoomAt]);

  const onImageLoad = useCallback((e) => {
    const img = e.currentTarget;
    setNatural({ w: img.naturalWidth || img.width, h: img.naturalHeight || img.height });
  }, []);

  useLayoutEffect(() => {
    if (!active) return undefined;
    const measure = () => {
      const el = frameRef.current;
      if (el) setFrame({ w: el.clientWidth, h: el.clientHeight });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [active]);
  useEffect(() => {
    setNatural(null);
    setOffset({ x: 0, y: 0 });
  }, [resetKey]);

  useEffect(() => {
    if (natural) reset();
  }, [natural, frame.w, frame.h, reset]);
  useEffect(() => {
    const el = frameRef.current;
    if (!active || !el) return undefined;
    const onWheel = (e) => {
      zoomAt(live.current.scale * Math.pow(1.0015, -e.deltaY), e.clientX, e.clientY);
    };
    el.addEventListener('wheel', onWheel, { passive: true });
    return () => el.removeEventListener('wheel', onWheel);
  }, [active, zoomAt]);

  const pointers = useRef(new Map());
  const pinch = useRef(null);

  const onPointerDown = useCallback((e) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const ov = live.current.overflow;
    if (pointers.current.size === 1 && (ov.x > 0 || ov.y > 0)) {
      try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { pinch.current = null; }
      setDragging(true);
    }
    if (pointers.current.size === 2) pinch.current = null;
  }, []);

  const onPointerMove = useCallback((e) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];

    if (pts.length >= 2) {
      const [a, b] = pts;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if (pinch.current?.dist) zoomAt(live.current.scale * (dist / pinch.current.dist), mid.x, mid.y);
      pinch.current = { dist };
      return;
    }

    const ov = live.current.overflow;
    if (ov.x <= 0 && ov.y <= 0) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    setOffset((o) => clampOffset({ x: o.x + dx, y: o.y + dy }, ov));
  }, [clampOffset, zoomAt]);

  const endPointer = useCallback((e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) setDragging(false);
  }, []);

  useEffect(() => {
    if (!active) {
      pointers.current.clear();
      pinch.current = null;
      setDragging(false);
    }
  }, [active]);

  return {
    frameRef,
    scale,
    fitScale,
    offset,
    natural,
    canPan,
    isFitted,
    dragging,
    atMax: scale >= MAX_SCALE - EPS,
    onImageLoad,
    zoomIn,
    zoomOut,
    reset,
    toggleZoom,
    panHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
    },
  };
}