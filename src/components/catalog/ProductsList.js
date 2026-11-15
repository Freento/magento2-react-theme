import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@apollo/client';
import ProductCard from './ProductCard';
import CarouselIndicators from '../ui/CarouselIndicators';
import { INLINE_EDIT_STYLE } from 'editor-core/inline-edit-style';
import { GET_PRODUCTS_LIST } from '../../queries/catalog';
import { useAuth } from '../../context/AuthContext';
import { readCustomerToken } from '../../lib/customerToken';

// Which token each carousel request was last fetched with, for this page session.
// Signing in without a page load keeps the catalog cache, so a list fetched as a
// guest is still there with guest prices; until the request has gone out with the
// current token it is fetched network-only and whatever Apollo still holds is not
// shown — the skeleton stands in until the customer's prices arrive, instead of the
// guest ones being shown and then repriced. Signing out reloads the page.
const fetchedWithToken = new Map();
const CATEGORY_PAGE_SIZE = 20;
const ITEMS_PER_SLIDE = 4;
const EMPTY = [];

const shuffle = (list) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

function useInView({ rootMargin = '300px', once = true } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (inView && once) return;
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const obs = new IntersectionObserver((entries) => {
      const hit = entries.some((e) => e.isIntersecting);
      if (hit) {
        setInView(true);
        if (once) obs.disconnect();
      }
    }, { rootMargin });
    obs.observe(node);
    return () => obs.disconnect();
  }, [rootMargin, once, inView]);
  return [ref, inView];
}

/**
 * Which responsive tier the carousel is in — 'phone' (≤600px), 'tablet'
 * (601–900px) or 'desktop'. Read after hydration, so SSR always renders the
 * desktop tree and the client corrects it.
 */
function useViewportTier() {
  const [tier, setTier] = useState('desktop');
  useEffect(() => {
    const phone = window.matchMedia('(max-width: 600px)');
    const upToTablet = window.matchMedia('(max-width: 900px)');
    const update = () => setTier(phone.matches ? 'phone' : upToTablet.matches ? 'tablet' : 'desktop');
    update();
    phone.addEventListener('change', update);
    upToTablet.addEventListener('change', update);
    return () => {
      phone.removeEventListener('change', update);
      upToTablet.removeEventListener('change', update);
    };
  }, []);
  return tier;
}

function usePageLoaded() {
  const [loaded, setLoaded] = useState(() =>
    typeof document !== 'undefined' && document.readyState === 'complete',
  );
  useEffect(() => {
    if (loaded || typeof window === 'undefined') return;
    const onLoad = () => setLoaded(true);
    window.addEventListener('load', onLoad, { once: true });
    return () => window.removeEventListener('load', onLoad);
  }, [loaded]);
  return loaded;
}

const Arrow = ({ dir }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {dir === 'left' ? (
      <>
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </>
    ) : (
      <>
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </>
    )}
  </svg>
);

/**
 * The author's list of SKUs, in the order they put them.
 *
 * It arrives as a list of `{ sku }` rows from the editor; a plain comma-
 * separated string is still read, because documents written before the list
 * editor existed hold one.
 */
const parseSkus = (value) => {
  const raw = Array.isArray(value)
    ? value.map((v) => (v && typeof v === 'object' ? v.sku : v))
    : String(value || '').split(',');
  return raw.map((s) => String(s ?? '').trim()).filter(Boolean);
};

export default function ProductsList({
  title = 'Products',
  dataSource = 'category',
  categoryId = '',
  products: pickedProducts = [],
  randomize = false,
  appearance = 'carousel',
  productsCount,
  columns,
  _editor,
}) {
  const [sectionRef, inView] = useInView({ rootMargin: '300px' });
  const pageLoaded = usePageLoaded();
  const { isAuthenticated } = useAuth();
  const token = isAuthenticated ? readCustomerToken() : null;
  // Products load in the browser only, once the page has loaded and the block is
  // near the viewport: the server and the prerender render the skeleton and send
  // no GraphQL, so a prerendered page never carries stale product data or guest
  // prices for a signed-in customer, and a page rendered live (edited since the
  // build) does not ask Magento on every request. Documents may still carry the
  // old `priority` prop; it no longer changes anything.
  const shouldFetch = (inView && pageLoaded) || !!_editor;
  const skuList = useMemo(() => parseSkus(pickedProducts), [pickedProducts]);
  const fromSkus = dataSource === 'products';
  const isGrid = appearance === 'grid';
  const categoryPageSize = isGrid && Number(productsCount) > 0 ? Number(productsCount) : CATEGORY_PAGE_SIZE;
  const gridColumns = Number(columns) > 0 ? Number(columns) : ITEMS_PER_SLIDE;
  // An empty list would filter on nothing and bring back the whole catalogue.
  const nothingToAsk = fromSkus ? !skuList.length : !categoryId;
  const variables = {
    filter: fromSkus
      ? { sku: { in: skuList } }
      : { category_id: { eq: String(categoryId) } },
    pageSize: fromSkus ? skuList.length : categoryPageSize,
  };
  const listKey = JSON.stringify(variables);
  const isCurrent = !token || fetchedWithToken.get(listKey) === token;
  const { loading, error, data } = useQuery(GET_PRODUCTS_LIST, {
    variables,
    skip: !shouldFetch || nothingToAsk,
    fetchPolicy: isCurrent ? 'cache-first' : 'network-only',
  });

  // A re-render once the token is recorded: the render that delivered the data
  // still treated it as someone else's.
  const [, setFetchedVersion] = useState(0);
  useEffect(() => {
    if (loading || !data || !token || fetchedWithToken.get(listKey) === token) return;
    fetchedWithToken.set(listKey, token);
    setFetchedVersion((v) => v + 1);
  }, [loading, data, token, listKey]);

  // Until then the list is someone else's: keep the skeleton up rather than flash
  // "No products found" for that one render.
  const pending = !shouldFetch || (!isCurrent && !error);
  const rawProducts = (isCurrent && data?.products?.items) || EMPTY;
  const orderedProducts = useMemo(() => {
    if (!fromSkus) return rawProducts;
    // Magento answers an `in` filter in its own order; the author wrote theirs.
    const rank = new Map(skuList.map((sku, i) => [sku, i]));
    return [...rawProducts].sort(
      (a, b) => (rank.get(a.sku) ?? Infinity) - (rank.get(b.sku) ?? Infinity),
    );
  }, [fromSkus, rawProducts, skuList]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const products = useMemo(
    () => (randomize && mounted ? shuffle(orderedProducts) : orderedProducts),
    [randomize, mounted, orderedProducts],
  );
  const showSkeleton = !nothingToAsk && (pending || (loading && products.length === 0));
  const tier = useViewportTier();
  const isMobile = tier !== 'desktop';
  // Never fewer than two cards per slide: a single full-width card reads as
  // an oversized banner rather than as a carousel.
  const perSlide = tier === 'phone' ? 2
    : tier === 'tablet' ? 3
    : ITEMS_PER_SLIDE;
  const totalSlides = Math.max(1, Math.ceil(products.length / perSlide));
  const expectedCount = fromSkus ? skuList.length : categoryPageSize;
  const desktopPerSlide = ITEMS_PER_SLIDE;
  const [slide, setSlide] = useState(0);
  const slides = [];
  for (let i = 0; i < products.length; i += perSlide) {
    slides.push(products.slice(i, i + perSlide));
  }

  useEffect(() => {
    setSlide((s) => Math.min(s, totalSlides - 1));
  }, [totalSlides]);

  const prev = () => setSlide((s) => (s - 1 + totalSlides) % totalSlides);
  const next = () => setSlide((s) => (s + 1) % totalSlides);

  const slideRefs = useRef([]);
  const [trackHeight, setTrackHeight] = useState(null);
  useEffect(() => {
    const el = slideRefs.current[slide];
    if (!el) {
      setTrackHeight(null);
      return;
    }
    const measure = () => setTrackHeight(el.offsetHeight);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const obs = new ResizeObserver(measure);
    obs.observe(el);
    return () => obs.disconnect();
  }, [slide, products.length, perSlide]);

  const drag = useRef({ startX: 0, startY: 0, dx: 0, active: false, recognized: false });
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const onTouchStart = (e) => {
    const t = e.touches[0];
    drag.current = { startX: t.clientX, startY: t.clientY, dx: 0, active: true, recognized: false };
  };
  const onTouchMove = (e) => {
    const d = drag.current;
    if (!d.active) return;
    const t = e.touches[0];
    const dx = t.clientX - d.startX;
    const dy = t.clientY - d.startY;
    if (!d.recognized) {
      if (Math.abs(dx) < 8) return;
      if (Math.abs(dx) <= Math.abs(dy)) {
        d.active = false;
        return;
      }
      d.recognized = true;
      setDragging(true);
    }
    d.dx = dx;
    const atEdge = (slide === 0 && dx > 0) || (slide === totalSlides - 1 && dx < 0);
    setDragX(atEdge ? dx * 0.3 : dx);
  };
  const endDrag = (commit) => {
    const d = drag.current;
    const wasRecognized = d.recognized;
    const dx = d.dx;
    drag.current = { startX: 0, startY: 0, dx: 0, active: false, recognized: false };
    if (!wasRecognized) return;
    setDragging(false);
    setDragX(0);
    if (!commit) return;
    if (dx > 60 && slide > 0) setSlide(slide - 1);
    else if (dx < -60 && slide < totalSlides - 1) setSlide(slide + 1);
  };
  const touchHandlers = isMobile && totalSlides > 1 && !_editor
    ? {
        onTouchStart,
        onTouchMove,
        onTouchEnd: () => endDrag(true),
        onTouchCancel: () => endDrag(false),
      }
    : {};

  const editable = !!_editor?.isSelected;

  return (
    <section className="pc-section" ref={sectionRef}>
      <div className="pc-head flex items-end justify-between gap-4 max768:pb-[5%]">
        <div className="pc-head-text flex flex-col gap-1.5 min-w-0">
          {editable ? (
            <h2
              className="pc-title text-2xl font-semibold text-ink tracking-[-0.015em] m-0"
              style={INLINE_EDIT_STYLE}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const v = e.currentTarget.innerText;
                if (v !== title) _editor.onUpdateProp?.(_editor.blockId, 'title', v);
              }}
            >
              {title}
            </h2>
          ) : (
            <h2 className="pc-title text-2xl font-semibold text-ink tracking-[-0.015em] m-0">{title}</h2>
          )}
        </div>
        {!isGrid && totalSlides > 1 && (
          <div className="pc-controls flex gap-2 max900:hidden" style={_editor ? { pointerEvents: 'auto' } : undefined}>
            <button onClick={prev} aria-label="Previous" className="icon-square">
              <Arrow dir="left" />
            </button>
            <button onClick={next} aria-label="Next" className="icon-square">
              <Arrow dir="right" />
            </button>
          </div>
        )}
      </div>

      {showSkeleton && isGrid ? (
        <div key="skeleton" className="pc-skeleton-wrap">
          <div
            className="pc-grid grid gap-y-[clamp(16px,2vw,32px)] gap-x-[clamp(12px,1.6vw,24px)] pt-[3%] max900:!grid-cols-2"
            style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: Math.max(expectedCount, 1) }).map((_, i) => (
              <div key={i} className="pc-skeleton flex flex-col">
                <div className="pc-skeleton-img sk-img w-full aspect-[4/5] mb-3.5 rounded" />
                <div className="pc-skeleton-title sk-img h-[calc(var(--fs-base)*1.35)] w-[70%] mb-[2px] rounded" />
                <div className="pc-skeleton-price sk-img h-[calc(var(--fs-base)*1.5)] w-[30%] rounded" />
                <div className="pc-skeleton-btn sk-img h-[calc(var(--fs-base)*1.5_+_24px)] w-full mt-3 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : showSkeleton ? (
        // A wrapper of its own, not a fragment: the loaded carousel is a fragment of
        // the same shape, and React would reuse these nodes for the track and its
        // slides — a placeholder card turned into slide 2 would then animate in from
        // x=0 across the block instead of simply appearing in place.
        <div key="skeleton" className="pc-skeleton-wrap">
          <div
            className="pc-grid grid gap-y-[clamp(16px,2vw,32px)] gap-x-[clamp(12px,1.6vw,24px)] pt-[3%] max900:!grid-cols-3 max600:!grid-cols-2"
            style={{ gridTemplateColumns: `repeat(${perSlide}, minmax(0, 1fr))` }}
          >
            {/* The server renders the desktop slide; the cards a narrower slide
                will not have are hidden at its width, so the placeholder is one
                row there too and does not shrink once the app has hydrated. */}
            {Array.from({ length: perSlide }).map((_, i) => (
              <div key={i} className={`pc-skeleton flex flex-col${i >= 3 ? ' max900:hidden' : ''}${i >= 2 ? ' max600:hidden' : ''}`}>
                <div className="pc-skeleton-img sk-img w-full aspect-[4/5] mb-3.5 rounded" />
                <div className="pc-skeleton-title sk-img h-[calc(var(--fs-base)*1.35)] w-[70%] mb-[2px] rounded" />
                <div className="pc-skeleton-price sk-img h-[calc(var(--fs-base)*1.5)] w-[30%] rounded" />
                <div className="pc-skeleton-btn sk-img h-[calc(var(--fs-base)*1.5_+_24px)] w-full mt-3 rounded" />
              </div>
            ))}
          </div>
          {/* The dots row the carousel will have (CarouselIndicators: pt-5 + 24px dot),
              so the block does not grow when the products arrive — per width, as
              the slide holds fewer cards on a tablet (3) and a phone (2). */}
          {expectedCount > 2 && (
            <div
              className={`pc-skeleton-dots h-11 ${expectedCount > desktopPerSlide ? 'block' : 'hidden'} ${expectedCount > 3 ? 'max900:block' : 'max900:hidden'} max600:block`}
              aria-hidden="true"
            />
          )}
        </div>
      ) : error && products.length === 0 ? (
        <div className="pc-error text-sale text-base">Products error: {error.message}</div>
      ) : products.length === 0 ? (
        <div className="pc-empty text-ink-2 text-base">No products found.</div>
      ) : isGrid ? (
        <div
          className="pc-grid grid gap-y-[clamp(16px,2vw,32px)] gap-x-[clamp(12px,1.6vw,24px)] pt-[3%] max900:!grid-cols-2"
          style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <>
          <div
            className={`pc-track grid items-start overflow-hidden [transition:height_0.4s_ease] [touch-action:pan-y] [--pc-slide-gap:0px] max900:[--pc-slide-gap:16px]${dragging ? ' pc-track--dragging' : ''}`}
            style={trackHeight != null ? { height: trackHeight } : undefined}
            {...touchHandlers}
          >
            {slides.map((slideProducts, i) => (
              <div
                key={i}
                ref={(el) => { slideRefs.current[i] = el; }}
                className={`pc-slide [grid-area:1/1] w-full${dragging ? '' : ' [transition:transform_0.4s_ease]'}`}
                style={{ transform: `translateX(calc(${i - slide} * (100% + var(--pc-slide-gap)) + ${dragX}px))` }}
                aria-hidden={i !== slide}
                inert={i !== slide ? '' : undefined}
              >
                <div
                  className="pc-grid grid gap-y-[clamp(16px,2vw,32px)] gap-x-[clamp(12px,1.6vw,24px)] pt-[3%] max900:!grid-cols-3 max600:!grid-cols-2"
                  style={{ gridTemplateColumns: `repeat(${perSlide}, minmax(0, 1fr))` }}
                >
                  {slideProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={_editor ? { pointerEvents: 'auto' } : undefined}>
            <CarouselIndicators total={totalSlides} current={slide} onSelect={setSlide} />
          </div>
        </>
      )}
    </section>
  );
}
