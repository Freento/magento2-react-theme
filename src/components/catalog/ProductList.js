import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import ProductCard from './ProductCard';
import Pagination from '../ui/Pagination';
import LayerNavigation from './LayerNavigation';
import { GET_AGGREGATIONS } from '../../queries/category';
import { addFilterValue, removeFilterValue, countFilterValues, clearFilterValues } from '../../hooks/filters/filterUrl';
const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="6" y1="12" x2="18" y2="12" />
    <line x1="9" y1="18" x2="15" y2="18" />
  </svg>
);
const Caret = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name: A-Z' },
  { value: 'name_desc', label: 'Name: Z-A' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

function flattenActiveFilters(filters, labelMap) {
  const out = [];
  if (!filters || typeof filters !== 'object') return out;
  const attrLabel = (attr) =>
    labelMap?.[attr]?.__label || attr;
  const optLabel = (attr, v) =>
    labelMap?.[attr]?.options?.[String(v)] || String(v);
  for (const [attr, val] of Object.entries(filters)) {
    if (attr === 'category_uid') continue; // internal query filter, not UI
    if (val == null || val === '') continue;
    if (attr === 'price' && typeof val === 'object' && val.from != null && val.to != null) {
      out.push({ attribute: 'price', value: null, label: 'Price', display: `$${val.from} – $${val.to}` });
      continue;
    }
    if (Array.isArray(val)) {
      for (const v of val) {
        out.push({ attribute: attr, value: v, label: attrLabel(attr), display: optLabel(attr, v) });
      }
    } else {
      out.push({ attribute: attr, value: val, label: attrLabel(attr), display: optLabel(attr, val) });
    }
  }
  return out;
}

const ProductList = ({
  products = [],
  totalCount = 0,
  pageInfo = {},
  currentPage = 1,
  onPageChange,
  currentSort,
  onSortChange,
  enabledLayerNavigation = false,
  activeFilters = [],
  onAddFilter,
  onRemoveFilter,
  onApplyFilters,
  onClearAllFilters,
  hasActiveFilters = false,
  onSetPriceRange,
  categoryId,
  searchTerm = null,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hasOpenedDrawer, setHasOpenedDrawer] = useState(false);
  const [pendingFilters, setPendingFilters] = useState(activeFilters);
  useEffect(() => {
    if (!drawerOpen) setPendingFilters(activeFilters);
  }, [activeFilters, drawerOpen]);
  const openDrawer = () => {
    setPendingFilters(activeFilters);
    setDrawerOpen(true);
    setHasOpenedDrawer(true);
  };
  const pendingAdd = (attribute, value) => setPendingFilters((f) => addFilterValue(f, attribute, value));
  const pendingRemove = (attribute, value = null) => setPendingFilters((f) => removeFilterValue(f, attribute, value));
  const pendingPrice = (from, to) => setPendingFilters((f) => ({ ...f, price: { from, to } }));
  const pendingClear = () => setPendingFilters((f) => clearFilterValues(f));
  const hasPendingFilters = countFilterValues(pendingFilters) > 0;
  const applyPending = () => {
    if (onApplyFilters) onApplyFilters(pendingFilters);
    setDrawerOpen(false);
  };
  const plpDrawerRef = useRef(null);
  const aggVariables = useMemo(() => {
    const filters = {};
    const cu = activeFilters?.category_uid;
    if (cu) filters.category_uid = typeof cu === 'object' ? cu : { eq: cu };
    return { filters, ...(searchTerm ? { search: searchTerm } : {}) };
  }, [activeFilters?.category_uid, searchTerm]);
  const { data: aggData } = useQuery(GET_AGGREGATIONS, {
    variables: aggVariables,
    skip: !enabledLayerNavigation || !hasActiveFilters,
    fetchPolicy: 'cache-first',
  });
  const labelMap = useMemo(() => {
    const map = {};
    const aggs = aggData?.products?.aggregations || [];
    for (const a of aggs) {
      const opts = {};
      for (const o of a.options || []) opts[String(o.value)] = o.label;
      map[a.attribute_code] = { __label: a.label || a.attribute_code, options: opts };
    }
    return map;
  }, [aggData]);

  useEffect(() => {
    const el = plpDrawerRef.current;
    if (!el) return;
    if (drawerOpen) el.removeAttribute('inert');
    else el.setAttribute('inert', '');
  }, [drawerOpen]);

  // Lock body scroll while the drawer is open, and close on Esc.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  return (
    <div className="plp relative">
      <div className="plp-toolbar sticky top-[64px] max900:top-[56px] max480:!top-[52px] z-30 bg-bg/[0.96] backdrop-blur-[10px] [-webkit-backdrop-filter:blur(10px)] border-t border-b border-line mb-6 max768:-mx-gutter max768:px-gutter">
        <div className="plp-toolbar-row flex items-center justify-between gap-4 py-2.5">
          <div className="plp-toolbar-left flex items-center gap-3.5">
            {enabledLayerNavigation && (
              <button
                type="button"
                className="toolbar-btn inline-flex items-center gap-1.5 text-13 font-medium py-2 px-3 rounded bg-transparent text-ink border border-line cursor-pointer transition-colors duration-fast ease-[ease] hover:border-ink hover:bg-surface"
                onClick={openDrawer}
                aria-label="Open filters"
              >
                <FilterIcon />
                <Caret />
              </button>
            )}
            <span className="total-count font-serif italic font-normal text-ink-2 text-md whitespace-nowrap max768:hidden">
              {totalCount === 1 ? '1 item' : `${totalCount} items`}
            </span>
          </div>

          <div className="plp-toolbar-right flex items-center gap-3.5">
            <label className="plp-sort relative inline-flex items-center gap-2 text-13 text-ink">
              <span className="plp-sort-label text-xs font-medium tracking-[0.12em] uppercase text-ink-2">Sort</span>
              <select
                value={currentSort || 'name_asc'}
                onChange={(e) => onSortChange(e.target.value || null)}
                className="plp-sort-select appearance-none [font-family:inherit] leading-base text-13 font-medium bg-transparent border border-line rounded py-[7px] pr-7 pl-3 text-ink cursor-pointer [transition:border-color_120ms_ease] hover:border-ink focus:border-ink focus:outline-none"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <span className="plp-sort-caret absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-ink-2 inline-flex" aria-hidden="true"><Caret /></span>
            </label>
          </div>
        </div>

        {(() => {
          const chips = flattenActiveFilters(activeFilters, labelMap);
          if (!chips.length) return null;
          return (
            <div className="plp-chips flex flex-wrap gap-2 pb-3">
              {chips.map((c, i) => (
                <span key={`${c.attribute}-${c.value}-${i}`} className="plp-chip inline-flex items-center gap-1.5 text-sm py-[5px] px-2.5 rounded-pill bg-surface border border-line">
                  <span className="plp-chip-label font-medium text-ink">{c.label}:</span>
                  <span className="plp-chip-value text-ink-2">{c.display}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${c.label} ${c.display}`}
                    onClick={() => onRemoveFilter && onRemoveFilter(c.attribute, c.value)}
                    className="cursor-pointer text-ink-2 text-base leading-none pl-1 [transition:color_120ms_ease] hover:text-ink"
                  >×</button>
                </span>
              ))}
              <button
                type="button"
                className="plp-clear-all bg-transparent cursor-pointer text-ink-2 text-sm font-medium underline underline-offset-2 [transition:color_120ms_ease] hover:text-ink"
                onClick={onClearAllFilters}
              >
                Clear all
              </button>
            </div>
          );
        })()}
      </div>

      <div className="product-grid grid grid-cols-4 max900:grid-cols-2 gap-y-[clamp(16px,2vw,32px)] gap-x-[clamp(12px,1.6vw,24px)] mt-[clamp(20px,3vw,32px)]">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} priority={index < 4} />
        ))}
      </div>

      {totalCount === 0 && (
        <div className="no-products text-center px-5 py-20 text-ink-2 text-md bg-surface rounded-lg mt-6">
          {hasActiveFilters
            ? 'No products match your current filters. Try adjusting your selection.'
            : 'No products found.'}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={pageInfo?.total_pages || 1}
        onPageChange={onPageChange}
      />

      {enabledLayerNavigation && (
        <>
          {drawerOpen && (
            <div className="plp-scrim fixed inset-0 bg-ink/40 z-[80] animate-scrim" onClick={() => setDrawerOpen(false)} />
          )}
          <aside
            ref={plpDrawerRef}
            className={`plp-drawer ${drawerOpen ? 'is-open' : ''} fixed top-0 right-0 h-screen w-[380px] max-w-[100vw] bg-bg border-l border-line translate-x-full [transition:transform_240ms_ease] z-[90] flex flex-col max900:w-full max900:border-l-0 [&.is-open]:translate-x-0`}
            aria-label="Filters"
          >
            <div className="plp-drawer-head flex justify-between items-center py-4 px-5 border-b border-line">
              <h3 className="m-0 text-base font-semibold tracking-[-0.01em] text-ink">Filters</h3>
              <button
                type="button"
                className="icon-square"
                aria-label="Close filters"
                onClick={() => setDrawerOpen(false)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="plp-drawer-body flex-1 overflow-y-auto py-[18px] px-5">
              {hasOpenedDrawer && (
                <LayerNavigation
                  filters={pendingFilters}
                  onAddFilter={pendingAdd}
                  onRemoveFilter={pendingRemove}
                  onClearAllFilters={pendingClear}
                  hasActiveFilters={hasPendingFilters}
                  isVisible={true}
                  onHide={() => setDrawerOpen(false)}
                  onShow={() => {}}
                  onSetPriceRange={pendingPrice}
                  enabledLayerNavigation={enabledLayerNavigation}
                  categoryId={categoryId}
                  searchTerm={searchTerm}
                />
              )}
            </div>
            <div className="plp-drawer-foot py-3.5 px-5 border-t border-line flex gap-2">
              {hasPendingFilters && (
                <button
                  type="button"
                  className="btn-ghost flex-1 px-[18px] py-3 [transition:background-color_200ms_ease,border-color_200ms_ease]"
                  onClick={pendingClear}
                >
                  Clear all
                </button>
              )}
              <button
                type="button"
                className="btn-primary flex-1 px-[18px] py-3 [transition:background-color_200ms_ease,border-color_200ms_ease]"
                onClick={applyPending}
              >
                Apply
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
};

export default ProductList;
