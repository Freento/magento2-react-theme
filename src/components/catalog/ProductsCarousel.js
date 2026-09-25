import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@apollo/client';
import ProductCard from './ProductCard';
import CarouselIndicators from '../ui/CarouselIndicators';
import { INLINE_EDIT_STYLE } from 'editor-core/inline-edit-style';
import { GET_PRODUCTS_CAROUSEL } from '../../queries/catalog';
import { useAuth } from '../../context/AuthContext';
import { isSsrPersonalized } from '../../lib/ssrPersonalized';

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

export default function ProductsCarousel({
  title = 'New Arrivals',
  eyebrow = '',
  source = '',
  categoryId = '2',
  skus = [],
  pageSize = 10,
  itemsPerSlide = 4,
  sortBy = '',
  priority = false,
  _editor,
}) {
  const [sectionRef, inView] = useInView({ rootMargin: '300px' });
  const pageLoaded = usePageLoaded();
  const { isAuthenticated } = useAuth();
  // `priority` carousels fetch eagerly (server + client) so they render in SSR;
  // the rest stay lazy — fetched only once scrolled into view after page load.
  const shouldFetch = priority || (inView && pageLoaded) || !!_editor;
  // A named list of products is its own thing, not a slice of a category — the
  // shop's own "products list" widget works the same way.
  const skuList = useMemo(() => parseSkus(skus), [skus]);
  // Documents written before the author could choose have no `source`; there a
  // list of SKUs was itself the choice, so they keep reading that way.
  const fromSkus = source ? source === 'skus' : skuList.length > 0;
  // An empty list would filter on nothing and bring back the whole catalogue.
  const nothingToAsk = fromSkus && !skuList.length;
  const { loading, error, data } = useQuery(GET_PRODUCTS_CAROUSEL, {
    variables: {
      filter: fromSkus
        ? { sku: { in: skuList } }
        : { category_id: { eq: String(categoryId) } },
      pageSize: fromSkus ? skuList.length : Number(pageSize) || 10,
    },
    skip: !shouldFetch || nothingToAsk,
    // The home page is prerendered — one shared document, never personalized — so a
    // customer re-fetches for their group's prices.
    fetchPolicy: isAuthenticated && !isSsrPersonalized() ? 'cache-and-network' : 'cache-first',
    ssr: true,
  });

  const pending = !shouldFetch;
  const rawProducts = data?.products?.items || [];
  const products = (() => {
    // Magento answers an `in` filter in its own order; the author wrote theirs.
    if (!sortBy && fromSkus) {
      const rank = new Map(skuList.map((sku, i) => [sku, i]));
      return [...rawProducts].sort(
        (a, b) => (rank.get(a.sku) ?? Infinity) - (rank.get(b.sku) ?? Infinity),
      );
    }
    if (!sortBy) return rawProducts;
    const [field, dir = 'asc'] = String(sortBy).toLowerCase().split('_');
    const factor = dir === 'desc' ? -1 : 1;
    const cmp = (a, b) => {
      const av = field === 'id' ? Number(a.id) : a[field];
      const bv = field === 'id' ? Number(b.id) : b[field];
      if (av < bv) return -1 * factor;
      if (av > bv) return  1 * factor;
      return 0;
    };
    return [...rawProducts].sort(cmp);
  })();
  const showSkeleton = !nothingToAsk && (pending || (loading && products.length === 0));
  const tier = useViewportTier();
  const isMobile = tier !== 'desktop';
  // Never fewer than two cards per slide: a single full-width card reads as
  // an oversized banner rather than as a carousel.
  const perSlide = tier === 'phone' ? 2
    : tier === 'tablet' ? 3
    : Math.max(2, Number(itemsPerSlide) || 4);
  const totalSlides = Math.max(1, Math.ceil(products.length / perSlide));
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
  const touchHandlers = isMobile && totalSlides > 1
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
          {(eyebrow || editable) && (
            editable ? (
              <span
                className="pc-eyebrow text-xs font-medium tracking-[0.12em] uppercase text-ink-2"
                style={INLINE_EDIT_STYLE}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  const v = e.currentTarget.innerText;
                  if (v !== eyebrow) _editor.onUpdateProp?.(_editor.blockId, 'eyebrow', v);
                }}
              >
                {eyebrow}
              </span>
            ) : (
              <span className="pc-eyebrow text-xs font-medium tracking-[0.12em] uppercase text-ink-2">{eyebrow}</span>
            )
          )}
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
        {totalSlides > 1 && (
          <div className="pc-controls flex gap-2 max900:hidden">
            <button onClick={prev} aria-label="Previous" className="icon-square">
              <Arrow dir="left" />
            </button>
            <button onClick={next} aria-label="Next" className="icon-square">
              <Arrow dir="right" />
            </button>
          </div>
        )}
      </div>

      {showSkeleton ? (
        <div
          className="pc-grid grid gap-y-[clamp(16px,2vw,32px)] gap-x-[clamp(12px,1.6vw,24px)] pt-[3%] max900:!grid-cols-3 max600:!grid-cols-2"
          style={{ gridTemplateColumns: `repeat(${perSlide}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: perSlide }).map((_, i) => (
            <div key={i} className="pc-skeleton flex flex-col">
              <div className="pc-skeleton-img sk-img w-full aspect-[4/5] mb-3.5 rounded" />
              <div className="pc-skeleton-title sk-img h-[calc(var(--fs-base)*1.35)] w-[70%] mb-[2px] rounded" />
              <div className="pc-skeleton-price sk-img h-[calc(var(--fs-base)*1.5)] w-[30%] rounded" />
              <div className="pc-skeleton-btn sk-img h-[calc(var(--fs-base)*1.5_+_24px)] w-full mt-3 rounded" />
            </div>
          ))}
        </div>
      ) : error && products.length === 0 ? (
        <div className="pc-error text-sale text-base">Products error: {error.message}</div>
      ) : products.length === 0 ? (
        <div className="pc-empty text-ink-2 text-base">No products found.</div>
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
          <CarouselIndicators total={totalSlides} current={slide} onSelect={setSlide} />
        </>
      )}
    </section>
  );
}
