import { displayModeOf, showsRouteContent } from 'editor-core/routes';
import { getClientApolloClient } from '../apollo/client';
import { GET_CATEGORY_PRODUCTS } from '../queries/category';
import { GET_PRODUCT_DETAILS } from '../queries/product';
import { categoryProductsVariables } from './catalog';
import { hasRouteArea, prefetchRouteArea } from '../hooks/useRouteArea';

const ask = (cfg) => getClientApolloClient().query({ ...cfg, fetchPolicy: 'cache-first' });

/** The path a react-router <Link> resolved to, without origin or query. */
const pathOf = (el) => {
  const href = el.getAttribute?.('href');
  if (!href || !href.startsWith('/')) return null;
  return href.split(/[?#]/)[0];
};

/**
 * Each handler warms whatever the target page will actually ask for, and
 * resolves when it has. Returning null means there is nothing to warm.
 */
const handlers = {
  category: (el) => {
    const id = el.dataset.prefetchId;
    if (!id) return null;
    const products = () => ask({
      query: GET_CATEGORY_PRODUCTS,
      variables: categoryProductsVariables(id),
    });

    // A category the editor has decorated renders its blocks first, and its
    // document is the cheaper thing to ask for — a small JSON off our own
    // server rather than a page of products out of the shop. It also carries
    // the display mode, which decides whether the product query follows.
    const path = pathOf(el);
    if (!path || !hasRouteArea(path)) return products();
    return prefetchRouteArea(path)
      .then((doc) => (showsRouteContent(displayModeOf(doc)) ? products() : null));
  },
  product: (el) => {
    const key = el.dataset.prefetchKey;
    if (!key) return null;
    return ask({ query: GET_PRODUCT_DETAILS, variables: { urlKey: key } });
  },
};

const seen = new Set();
const MAX_ENTRIES = 100;

export const resetPrefetchDedupe = () => seen.clear();

const fire = (el) => {
  const type = el.dataset.prefetch;
  const id = el.dataset.prefetchId || el.dataset.prefetchKey;
  if (!type || !id) return;
  const dedupeKey = `${type}:${id}`;
  if (seen.has(dedupeKey)) return;
  if (seen.size >= MAX_ENTRIES) return;
  const started = handlers[type]?.(el);
  if (!started) return;
  seen.add(dedupeKey);
  started.catch(() => {
    seen.delete(dedupeKey);
  });
};

let attached = false;
let pendingTimer = null;
let pendingEl = null;
const HOVER_DELAY_MS = 200;

const cancelPending = () => {
  if (pendingTimer !== null) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
    pendingEl = null;
  }
};

export const attachPrefetcher = () => {
  if (attached || typeof document === 'undefined') return;
  attached = true;

  const onEnter = (e) => {
    const el = e.target?.closest?.('[data-prefetch]');
    if (!el) return;
    if (e.pointerType !== 'mouse') { fire(el); return; }
    cancelPending();
    pendingEl = el;
    pendingTimer = setTimeout(() => {
      pendingTimer = null;
      pendingEl = null;
      fire(el);
    }, HOVER_DELAY_MS);
  };
  const onLeave = (e) => {
    const el = e.target?.closest?.('[data-prefetch]');
    if (el && el === pendingEl) cancelPending();
  };
  const onTouch = (e) => {
    const el = e.target?.closest?.('[data-prefetch]');
    if (el) fire(el);
  };
  const onFocus = (e) => {
    const el = e.target?.closest?.('[data-prefetch]');
    if (el) fire(el);
  };

  const opts = { capture: true, passive: true };
  document.addEventListener('pointerenter', onEnter, opts);
  document.addEventListener('pointerleave', onLeave, opts);
  document.addEventListener('touchstart', onTouch, opts);
  document.addEventListener('focusin', onFocus, opts);
};
