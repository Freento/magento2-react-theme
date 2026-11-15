import { displayModeOf, showsRouteContent } from 'editor-core/routes';
import { getClientApolloClient } from '../apollo/client';
import { GET_CATEGORY_PRODUCTS } from '../queries/category';
import { GET_PRODUCT_DETAILS } from '../queries/product';
import { RESOLVE_URL } from '../queries/url';
import { categoryProductsVariables } from './catalog';
import { hasRouteArea, prefetchRouteArea } from '../hooks/useRouteArea';
import { getOperationName } from '@apollo/client/utilities';
import { readCustomerToken } from './customerToken';

// Requests a prefetch sent over the network while signed in, mapped to the token they
// carried. The page a customer then lands on revalidates its query for customer-group
// prices unless it can trust the cache; an entry recorded here under the token still in
// use is exactly such a case, so that page can read the cache and skip the repeat.
// Only real network fetches count: a prefetch answered from the cache (hydrated guest
// data, or something fetched before signing in) proves nothing about whose prices it holds.
const fetchedAsCustomer = new Map();
const requestKey = ({ query, variables }) => {
  const sorted = Object.keys(variables || {}).sort().map((k) => [k, variables[k]]);
  return `${getOperationName(query)}:${JSON.stringify(sorted)}`;
};

export const isPrefetchedForCustomer = (request) => {
  const token = readCustomerToken();
  return Boolean(token) && fetchedAsCustomer.get(requestKey(request)) === token;
};

const ask = (cfg) => {
  const client = getClientApolloClient();
  const token = readCustomerToken();
  // Null when the cache cannot answer the whole query, i.e. the fetch below is a real one.
  const fromNetwork = token && client.readQuery(cfg) === null;
  return client.query({ ...cfg, fetchPolicy: 'cache-first' }).then((result) => {
    // Recorded only if the same token is still in use once the answer is in.
    if (fromNetwork && readCustomerToken() === token) fetchedAsCustomer.set(requestKey(cfg), token);
    return result;
  });
};

/** The path a react-router <Link> resolved to, without origin or query. */
const pathOf = (el) => {
  const href = el.getAttribute?.('href');
  if (!href || !href.startsWith('/')) return null;
  return href.split(/[?#]/)[0];
};

const categoryProducts = (id, path) => {
  const products = () => ask({
    query: GET_CATEGORY_PRODUCTS,
    variables: categoryProductsVariables(id),
  });

  // A category the editor has decorated renders its blocks first, and its
  // document is the cheaper thing to ask for — a small JSON off our own
  // server rather than a page of products out of the shop. It also carries
  // the display mode, which decides whether the product query follows.
  if (!path || !hasRouteArea(path)) return products();
  return prefetchRouteArea(path)
    .then((doc) => (showsRouteContent(displayModeOf(doc)) ? products() : null));
};

const productDetails = (key) => ask({ query: GET_PRODUCT_DETAILS, variables: { urlKey: key } });

/**
 * Each handler warms whatever the target page will actually ask for, and
 * resolves when it has. Returning null means there is nothing to warm.
 */
const handlers = {
  category: (el) => {
    const id = el.dataset.prefetchId;
    if (!id) return null;
    return categoryProducts(id, pathOf(el));
  },
  product: (el) => {
    const key = el.dataset.prefetchKey;
    if (!key) return null;
    return productDetails(key);
  },
  route: (el) => {
    const path = pathOf(el);
    if (!path) return null;
    return getClientApolloClient()
      .query({ query: RESOLVE_URL, variables: { url: path }, fetchPolicy: 'cache-first' })
      .then(({ data }) => {
        const route = data?.route;
        if (route?.type === 'CATEGORY' && route.id) return categoryProducts(route.id, path);
        if (/PRODUCT$/.test(route?.type || '') && route.url_key) return productDetails(route.url_key);
        return null;
      });
  },
};

const seen = new Set();
const MAX_ENTRIES = 100;

export const resetPrefetchDedupe = () => {
  seen.clear();
  fetchedAsCustomer.clear();
};

const fire = (el) => {
  const type = el.dataset.prefetch;
  const id = el.dataset.prefetchId || el.dataset.prefetchKey || (type === 'route' ? pathOf(el) : null);
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
