import React, { useState, useEffect } from 'react';
import { src } from '../../../lib/productImage';
import { whenFirstImageReady } from '../../../lib/firstImageGate';
import ChevronLeftIcon from '../../ui/icons/ChevronLeftIcon';
import ChevronRightIcon from '../../ui/icons/ChevronRightIcon';
import ExpandIcon from '../../ui/icons/ExpandIcon';
import GalleryLightbox from './GalleryLightbox';
import useSwipeStrip from './hooks/useSwipeStrip';
import usePreloadNeighbours from './hooks/usePreloadNeighbours';
import useBackToClose from '../../../hooks/useBackToClose';
import { SLIDE_IN, SLIDE_OUT, slotTransform, stepDirection, stripSlots } from './helpers/gallerySwipe';

const NAV_BTN = 'pdp__nav absolute top-1/2 z-[2] -translate-y-1/2 w-10 h-10 inline-flex items-center justify-center rounded-pill border border-line bg-bg/90 text-ink cursor-pointer transition-colors duration-fast ease-[ease] hover:border-ink max900:hidden';
const PANEL = 'absolute inset-0 w-full h-full object-cover pointer-events-none';

const ProductGallery = ({
  gallery,
  activeImageIdx,
  onSelectImage,
  mainImg,
  mainImgLoading,
  onMainImgLoad,
  productName,
}) => {
  const [thumbsReleased, setThumbsReleased] = useState(false);
  useEffect(() => {
    let active = true;
    whenFirstImageReady().then(() => { if (active) setThumbsReleased(true); });
    return () => { active = false; };
  }, []);

  const [fullscreen, setFullscreen] = useState(false);
  useBackToClose('gallery', fullscreen, () => setFullscreen(false), () => setFullscreen(true));
  const count = gallery.length;
  const urls = gallery.map((g) => src(g));
  const mainUrl = src(mainImg);
  usePreloadNeighbours(urls, activeImageIdx);

  const swipe = useSwipeStrip({ count, index: activeImageIdx, onSelect: onSelectImage });

  const [transition, setTransition] = useState(null);
  const [shown, setShown] = useState({ idx: activeImageIdx, url: mainUrl });
  if (shown.url !== mainUrl) {
    if (count > 1 && swipe.landedOn !== activeImageIdx) {
      setTransition({ url: shown.url, dir: stepDirection(shown.idx, activeImageIdx, count) });
    } else {
      setTransition(null);
    }
    setShown({ idx: activeImageIdx, url: mainUrl });
  }

  const go = (delta) => onSelectImage((activeImageIdx + delta + count) % count);
  const slots = stripSlots(count, activeImageIdx).filter((slot) => slot.pos === 0 || thumbsReleased);

  return (
    <div className="pdp__gallery grid grid-cols-[80px_1fr] gap-4 items-start max900:flex max900:flex-col max900:gap-3">
      <div className="pdp__thumbs flex flex-col gap-2.5 max900:hidden" role="group" aria-label="Images">
        {gallery.map((g, i) => (
          <button
            key={src(g) + i}
            type="button"
            className="pdp__thumb w-20 h-[100px] bg-surface border border-line rounded overflow-hidden cursor-pointer p-0 [transition:border-color_120ms_ease] hover:border-ink aria-pressed:border-ink"
            aria-pressed={i === activeImageIdx}
            aria-label={`View ${i + 1}`}
            onClick={() => onSelectImage(i)}
          >
            <img
              src={thumbsReleased ? g.thumb || src(g) : undefined}
              data-deferred-src={thumbsReleased ? undefined : g.thumb || src(g)}
              suppressHydrationWarning
              alt=""
              className="w-full h-full object-contain p-1.5 bg-bg"
            />
          </button>
        ))}
      </div>
      <div
        className={`pdp__main${mainImgLoading ? ' is-loading' : ''} group w-full bg-surface rounded-lg overflow-hidden aspect-[4/5] relative touch-pan-y select-none`}
        {...swipe.handlers}
      >
        <div ref={swipe.stripRef} className="absolute inset-0 will-change-transform">
          {slots.map(({ idx, pos }) => (pos === 0 ? (
            <img
              key={`${idx}-${urls[idx]}`}
              src={urls[idx]}
              className={`absolute inset-0 w-full h-full object-cover cursor-zoom-in [transition:opacity_160ms_ease] group-[.is-loading]:opacity-0${transition ? ` ${SLIDE_IN[transition.dir]}` : ''}`}
              alt={productName}
              data-first-image=""
              fetchpriority="high"
              draggable="false"
              ref={(el) => { if (el?.complete) onMainImgLoad(); }}
              onLoad={onMainImgLoad}
              onError={onMainImgLoad}
              onClick={() => { if (!swipe.consumeClick()) setFullscreen(true); }}
            />
          ) : (
            <img
              key={`${idx}-${urls[idx]}`}
              src={urls[idx]}
              className={PANEL}
              style={{ transform: slotTransform(pos) }}
              alt=""
              aria-hidden="true"
              draggable="false"
            />
          )))}
        </div>
        {mainImgLoading && <div className="pdp__main-skeleton sk-img absolute inset-0 pointer-events-none rounded-[inherit]" aria-hidden="true" />}
        {transition && (
          <img
            key={`out-${transition.url}`}
            src={transition.url}
            alt=""
            aria-hidden="true"
            className={`${PANEL} bg-bg ${SLIDE_OUT[transition.dir]}`}
            onAnimationEnd={() => setTransition(null)}
          />
        )}
        <button
          type="button"
          className="pdp__expand absolute top-3 right-3 z-[2] w-9 h-9 inline-flex items-center justify-center rounded-pill border border-line bg-bg/90 text-ink cursor-pointer opacity-0 transition-[opacity,border-color] duration-fast ease-[ease] hover:border-ink focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
          aria-label="Open image fullscreen"
          onClick={() => setFullscreen(true)}
        >
          <ExpandIcon size={16} />
        </button>
        {count > 1 && (
          <>
            <button type="button" className={`${NAV_BTN} left-3`} aria-label="Previous image" onClick={() => go(-1)}>
              <ChevronLeftIcon />
            </button>
            <button type="button" className={`${NAV_BTN} right-3`} aria-label="Next image" onClick={() => go(1)}>
              <ChevronRightIcon />
            </button>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="pdp__dots hidden max900:flex w-full flex-wrap justify-center gap-2" role="group" aria-label="Images">
          {gallery.map((g, i) => (
            <button
              key={`dot-${src(g)}-${i}`}
              type="button"
              className={`pdp__dot w-2.5 h-2.5 p-0 rounded-pill border cursor-pointer transition-colors duration-fast ease-[ease] ${i === activeImageIdx ? 'bg-ink border-ink' : 'bg-transparent border-line-dark'}`}
              aria-label={`Go to image ${i + 1}`}
              aria-pressed={i === activeImageIdx}
              onClick={() => onSelectImage(i)}
            />
          ))}
        </div>
      )}
      {fullscreen && (
        <GalleryLightbox
          gallery={gallery}
          index={activeImageIdx}
          onIndexChange={onSelectImage}
          onClose={() => setFullscreen(false)}
          productName={productName}
        />
      )}
    </div>
  );
};

export default ProductGallery;
