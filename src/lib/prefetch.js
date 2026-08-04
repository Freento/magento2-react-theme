import { getClientApolloClient } from '../apollo/client';
import { GET_CATEGORY_PRODUCTS } from '../queries/category';
import { GET_PRODUCT_DETAILS } from '../queries/product';
import { CATEGORY_PAGE_SIZE } from './catalog';

const categoryUid = (id) => btoa(String(id));

const handlers = {
  category: (el) => {
    const id = el.dataset.prefetchId;
    if (!id) return null;
    return {
      query: GET_CATEGORY_PRODUCTS,
      variables: {
        filters: { category_uid: { eq: categoryUid(id) } },
        currentPage: 1,
        pageSize: CATEGORY_PAGE_SIZE,
      },
    };
  },
  product: (el) => {
    const key = el.dataset.prefetchKey;
    if (!key) return null;
    return { query: GET_PRODUCT_DETAILS, variables: { urlKey: key } };
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
  const cfg = handlers[type]?.(el);
  if (!cfg) return;
  seen.add(dedupeKey);
  const client = getClientApolloClient();
  client.query({ ...cfg, fetchPolicy: 'cache-first' }).catch(() => {
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
