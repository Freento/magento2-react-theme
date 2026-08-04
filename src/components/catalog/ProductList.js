import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import ProductCard from './ProductCard';
import Pagination from '../ui/Pagination';
import LayerNavigation from './LayerNavigation';
import { GET_AGGREGATIONS } from '../../queries/category';
import '../../styles/catalog/ProductList.less';
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
  onClearAllFilters,
  hasActiveFilters = false,
  onSetPriceRange,
  categoryId,
  searchTerm = null,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hasOpenedDrawer, setHasOpenedDrawer] = useState(false);
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
    <div className="plp">
      <div className="plp-toolbar">
        <div className="plp-toolbar-row">
          <div className="plp-toolbar-left">
            {enabledLayerNavigation && (
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => { setDrawerOpen(true); setHasOpenedDrawer(true); }}
                aria-label="Open filters"
              >
                <FilterIcon />
                <Caret />
              </button>
            )}
            <span className="total-count">
              {totalCount === 1 ? '1 item' : `${totalCount} items`}
            </span>
          </div>

          <div className="plp-toolbar-right">
            <label className="plp-sort">
              <span className="plp-sort-label">Sort</span>
              <select
                value={currentSort || 'name_asc'}
                onChange={(e) => onSortChange(e.target.value || null)}
                className="plp-sort-select"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <span className="plp-sort-caret" aria-hidden="true"><Caret /></span>
            </label>
          </div>
        </div>

        {(() => {
          const chips = flattenActiveFilters(activeFilters, labelMap);
          if (!chips.length) return null;
          return (
            <div className="plp-chips">
              {chips.map((c, i) => (
                <span key={`${c.attribute}-${c.value}-${i}`} className="plp-chip">
                  <span className="plp-chip-label">{c.label}:</span>
                  <span className="plp-chip-value">{c.display}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${c.label} ${c.display}`}
                    onClick={() => onRemoveFilter && onRemoveFilter(c.attribute, c.value)}
                  >×</button>
                </span>
              ))}
              <button
                type="button"
                className="plp-clear-all"
                onClick={onClearAllFilters}
              >
                Clear all
              </button>
            </div>
          );
        })()}
      </div>

      <div className="product-grid">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} priority={index < 4} />
        ))}
      </div>

      {totalCount === 0 && (
        <div className="no-products">
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
            <div className="plp-scrim" onClick={() => setDrawerOpen(false)} />
          )}
          <aside
            ref={plpDrawerRef}
            className={`plp-drawer ${drawerOpen ? 'is-open' : ''}`}
            aria-label="Filters"
          >
            <div className="plp-drawer-head">
              <h3>Filters</h3>
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
            <div className="plp-drawer-body">
              {hasOpenedDrawer && (
                <LayerNavigation
                  filters={activeFilters}
                  onAddFilter={onAddFilter}
                  onRemoveFilter={onRemoveFilter}
                  onClearAllFilters={onClearAllFilters}
                  hasActiveFilters={hasActiveFilters}
                  isVisible={true}
                  onHide={() => {}}
                  onShow={() => {}}
                  onSetPriceRange={onSetPriceRange}
                  enabledLayerNavigation={enabledLayerNavigation}
                  categoryId={categoryId}
                  searchTerm={searchTerm}
                />
              )}
            </div>
            <div className="plp-drawer-foot">
              {hasActiveFilters && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={onClearAllFilters}
                >
                  Clear all
                </button>
              )}
              <button
                type="button"
                className="btn-primary"
                onClick={() => setDrawerOpen(false)}
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
