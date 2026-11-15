import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { src } from '../../../lib/productImage';
import ChevronLeftIcon from '../../ui/icons/ChevronLeftIcon';
import ChevronRightIcon from '../../ui/icons/ChevronRightIcon';
import CloseIcon from '../../ui/icons/CloseIcon';
import ZoomInIcon from '../../ui/icons/ZoomInIcon';
import ZoomOutIcon from '../../ui/icons/ZoomOutIcon';
import useZoomPan from './hooks/useZoomPan';
import usePreloadNeighbours from './hooks/usePreloadNeighbours';
import useSwipeStrip from './hooks/useSwipeStrip';
import { SLIDE_IN, SLIDE_OUT, slotTransform, stepDirection, stripSlots } from './helpers/gallerySwipe';

const TOOL_BTN = 'w-11 h-11 inline-flex items-center justify-center border-0 bg-transparent text-ink cursor-pointer rounded transition-[color,background,opacity] duration-fast ease-[ease] hover:enabled:bg-surface disabled:opacity-30 disabled:cursor-default';
const SIDE_BTN = 'absolute top-0 bottom-0 z-[2] w-20 flex items-center justify-center border-0 bg-bg/30 text-ink cursor-pointer transition-colors duration-fast ease-[ease] hover:bg-bg/70 max768:hidden';
const SLIDE = 'absolute inset-0 flex items-center justify-center bg-bg';
const PLACEHOLDER = 'absolute inset-0 m-auto max-w-full max-h-full pointer-events-none';

export default function GalleryLightbox({ gallery, index, onIndexChange, onClose, productName }) {
  const image = gallery[index] || {};
  const sizedSrc = src(image);
  const fullSrc = image.full || sizedSrc;
  const count = gallery.length;

  const seenSrcs = useRef(new Set());
  const sizedSrcs = useRef(new Set());
  const [, bump] = useState(0);
  const loaded = seenSrcs.current.has(fullSrc);
  const sizedReady = sizedSrcs.current.has(sizedSrc);
  const markLoaded = (url) => { seenSrcs.current.add(url); bump((n) => n + 1); };
  const markSized = (url) => { sizedSrcs.current.add(url); bump((n) => n + 1); };

  const placeholderRef = useRef(null);
  useEffect(() => {
    if (placeholderRef.current?.complete) markSized(sizedSrc);
  }, [sizedSrc]);


  const zoom = useZoomPan({ active: true, resetKey: fullSrc });
  const overlayRef = useRef(null);
  const strip = useSwipeStrip({ count, index, onSelect: onIndexChange, enabled: !zoom.canPan });
  const [slide, setSlide] = useState(null);
  const [shown, setShown] = useState({ idx: index, full: fullSrc, sized: sizedSrc });
  if (shown.full !== fullSrc) {
    if (count > 1 && strip.landedOn !== index) {
      setSlide({ dir: stepDirection(shown.idx, index, count), src: shown.sized });
    } else {
      setSlide(null);
    }
    setShown({ idx: index, full: fullSrc, sized: sizedSrc });
  }

  usePreloadNeighbours(gallery.map((g) => src(g)), index);

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => { root.style.overflow = previous; };
  }, []);

  const { zoomIn, zoomOut, reset } = zoom;
  useEffect(() => {
    const onKeyDown = (e) => {
      switch (e.key) {
        case 'Escape': onClose(); break;
        case 'ArrowLeft': if (count > 1) onIndexChange((index - 1 + count) % count); break;
        case 'ArrowRight': if (count > 1) onIndexChange((index + 1) % count); break;
        case '+': case '=': zoomIn(); break;
        case '-': case '_': zoomOut(); break;
        case '0': reset(); break;
        default: return;
      }
      e.preventDefault();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [count, index, onIndexChange, onClose, zoomIn, zoomOut, reset]);

  useEffect(() => { overlayRef.current?.focus(); }, []);

  const thumbsRef = useRef(null);
  useLayoutEffect(() => {
    const btn = thumbsRef.current?.querySelectorAll('.pdp-lightbox__thumb')[index];
    btn?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [index]);

  const step = (delta) => onIndexChange((index + delta + count) % count);

  const pressed = useRef(null);
  const onImageClick = (e) => {
    const from = pressed.current;
    pressed.current = null;
    if (strip.consumeClick()) return;
    if (from && Math.hypot(e.clientX - from.x, e.clientY - from.y) > 4) return;
    zoom.toggleZoom(e.clientX, e.clientY);
  };

  const percent = zoom.natural ? Math.round(zoom.scale * 100) : null;
  const slots = stripSlots(count, index);
  const frameCursor = zoom.dragging ? 'cursor-grabbing' : zoom.canPan ? 'cursor-grab' : 'cursor-zoom-in';

  return createPortal(
    <div
      className="pdp-lightbox fixed inset-0 z-[1200] flex flex-col bg-bg outline-none"
      role="dialog"
      aria-modal="true"
      aria-label={`${productName || 'Product'} images`}
      ref={overlayRef}
      tabIndex={-1}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="pdp-lightbox__bar flex flex-none items-center justify-between gap-4 px-4 py-3 border-b border-line text-ink">
        <span className="pdp-lightbox__counter text-13 text-ink-2 tabular-nums">
          {count > 1 ? `${index + 1} / ${count}` : ''}
        </span>
        <div className="pdp-lightbox__tools flex items-center gap-1">
          {percent !== null && <span className="min-w-[46px] text-right text-xs text-ink-2 tabular-nums max768:hidden">{percent}%</span>}
          <button type="button" className={TOOL_BTN} onClick={zoomOut} disabled={zoom.isFitted} aria-label="Zoom out">
            <ZoomOutIcon size={20} />
          </button>
          <button type="button" className={TOOL_BTN} onClick={zoomIn} disabled={zoom.atMax} aria-label="Zoom in">
            <ZoomInIcon size={20} />
          </button>
          <button type="button" className={TOOL_BTN} onClick={onClose} aria-label="Close">
            <CloseIcon size={20} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div
        className={`pdp-lightbox__frame relative flex flex-1 items-center justify-center overflow-hidden select-none [touch-action:none] ${frameCursor}`}
        ref={zoom.frameRef}
        {...zoom.panHandlers}
        onPointerDownCapture={(e) => { pressed.current = { x: e.clientX, y: e.clientY }; strip.handlers.onPointerDown(e); }}
        onPointerMoveCapture={strip.handlers.onPointerMove}
        onPointerUpCapture={strip.handlers.onPointerUp}
        onPointerCancelCapture={strip.handlers.onPointerCancel}
        onClick={onImageClick}
      >
        <div ref={strip.stripRef} className="absolute inset-0 will-change-transform">
          {slots.map(({ idx, pos }) => {
            const slotSized = src(gallery[idx]);
            const current = pos === 0;
            return (
              <div
                key={`${idx}-${slotSized}`}
                className={`${SLIDE}${current && slide ? ` ${SLIDE_IN[slide.dir]}` : ''}`}
                style={{ transform: slotTransform(pos) }}
                aria-hidden={current ? undefined : 'true'}
              >
                {(!current || !(loaded && zoom.natural)) && (
                  <img
                    ref={current ? placeholderRef : undefined}
                    className={PLACEHOLDER}
                    src={slotSized}
                    alt=""
                    aria-hidden="true"
                    onLoad={current ? () => markSized(slotSized) : undefined}
                    onError={current ? () => markSized(slotSized) : undefined}
                  />
                )}
                {current && (
                  <img
                    key={fullSrc}
                    className="pdp-lightbox__img max-w-none max-h-none origin-center will-change-transform [-webkit-user-drag:none]"
                    src={fullSrc}
                    alt={productName || ''}
                    draggable="false"
                    style={{
                      transform: `translate(${zoom.offset.x}px, ${zoom.offset.y}px) scale(${zoom.scale})`,
                      visibility: loaded && zoom.natural ? 'visible' : 'hidden',
                    }}
                    onLoad={(e) => { zoom.onImageLoad(e); markLoaded(fullSrc); }}
                    onError={() => markLoaded(fullSrc)}
                  />
                )}
              </div>
            );
          })}
        </div>

        {slide && (
          <div
            key={`out-${slide.src}`}
            className={`${SLIDE} ${SLIDE_OUT[slide.dir]}`}
            aria-hidden="true"
            onAnimationEnd={() => setSlide(null)}
          >
            <img className={PLACEHOLDER} src={slide.src} alt="" />
          </div>
        )}

        {!sizedReady && !loaded && (
          <span className="absolute left-1/2 top-1/2 -ml-5 -mt-5 w-10 h-10 rounded-full border-[3px] border-line border-t-ink animate-spin pointer-events-none" aria-hidden="true" />
        )}

        {count > 1 && (
          <>
            <button
              type="button"
              className={`${SIDE_BTN} left-0`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); step(-1); }}
              aria-label="Previous image"
            >
              <ChevronLeftIcon size={28} />
            </button>
            <button
              type="button"
              className={`${SIDE_BTN} right-0`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); step(1); }}
              aria-label="Next image"
            >
              <ChevronRightIcon size={28} />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="pdp-lightbox__thumbs flex flex-none gap-1.5 overflow-x-auto px-4 pt-2 pb-4 [justify-content:safe_center]" ref={thumbsRef}>
          {gallery.map((g, i) => (
            <button
              key={`lb-${src(g)}-${i}`}
              type="button"
              className="pdp-lightbox__thumb flex-none w-20 h-24 max768:w-[52px] max768:h-[62px] p-0.5 border border-line rounded bg-bg cursor-pointer overflow-hidden transition-colors duration-fast ease-[ease] hover:border-ink aria-pressed:border-ink"
              aria-label={`View ${i + 1}`}
              aria-pressed={i === index}
              onClick={() => onIndexChange(i)}
            >
              <img src={g.thumb || src(g)} alt="" className="w-full h-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
