import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client';
import ProductCard from './ProductCard';
import { INLINE_EDIT_STYLE } from 'editor-core/inline-edit-style';
import '../../styles/catalog/ProductsCarousel.less';
import { GET_PRODUCTS_CAROUSEL } from '../../queries/catalog';

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

export default function ProductsCarousel({
  title = 'New Arrivals',
  eyebrow = '',
  categoryId = '2',
  pageSize = 10,
  itemsPerSlide = 4,
  sortBy = '',
  priority = false,
  _editor,
}) {
  const [sectionRef, inView] = useInView({ rootMargin: '300px' });
  const pageLoaded = usePageLoaded();
  // `priority` carousels fetch eagerly (server + client) so they render in SSR;
  // the rest stay lazy — fetched only once scrolled into view after page load.
  const shouldFetch = priority || (inView && pageLoaded) || !!_editor;
  const { loading, error, data } = useQuery(GET_PRODUCTS_CAROUSEL, {
    variables: { categoryId: String(categoryId), pageSize: Number(pageSize) || 10 },
    skip: !shouldFetch,
    fetchPolicy: 'cache-first',
    ssr: true,
  });

  const pending = !shouldFetch;
  const rawProducts = data?.products?.items || [];
  const products = (() => {
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
  const showSkeleton = pending || (loading && products.length === 0);
  const perSlide = Math.max(1, Number(itemsPerSlide) || 4);
  const totalSlides = Math.max(1, Math.ceil(products.length / perSlide));
  const [slide, setSlide] = useState(0);
  const visible = products.slice(slide * perSlide, slide * perSlide + perSlide);

  const prev = () => setSlide((s) => (s - 1 + totalSlides) % totalSlides);
  const next = () => setSlide((s) => (s + 1) % totalSlides);

  const editable = !!_editor?.isSelected;

  return (
    <section className="pc-section" ref={sectionRef}>
      <div className="pc-head">
        <div className="pc-head-text">
          {(eyebrow || editable) && (
            editable ? (
              <span
                className="pc-eyebrow"
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
              <span className="pc-eyebrow">{eyebrow}</span>
            )
          )}
          {editable ? (
            <h2
              className="pc-title"
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
            <h2 className="pc-title">{title}</h2>
          )}
        </div>
        {totalSlides > 1 && (
          <div className="pc-controls">
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
          className="pc-grid"
          style={{ gridTemplateColumns: `repeat(${perSlide}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: perSlide }).map((_, i) => (
            <div key={i} className="pc-skeleton">
              <div className="pc-skeleton-img sk-img" />
              <div className="pc-skeleton-title sk-img" />
              <div className="pc-skeleton-price sk-img" />
              <div className="pc-skeleton-btn sk-img" />
            </div>
          ))}
        </div>
      ) : error && products.length === 0 ? (
        <div className="pc-error">Products error: {error.message}</div>
      ) : products.length === 0 ? (
        <div className="pc-empty">No products found.</div>
      ) : (
        <div
          className="pc-grid"
          style={{ gridTemplateColumns: `repeat(${perSlide}, minmax(0, 1fr))` }}
        >
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
