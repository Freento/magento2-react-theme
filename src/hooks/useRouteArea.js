import { useEffect, useReducer, useRef } from 'react';

const isBrowser = typeof window !== 'undefined';

const cache = new Map();
// Two mounts of the same path in one tick — StrictMode's double-invoked effect
// in dev, a remount in prod — must not each put a request on the wire.
const inFlight = new Map();

// The editor announces every save on this channel. Without dropping the entry
// a storefront tab left open would keep serving what it fetched before the edit.
if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  try {
    new BroadcastChannel('editor:pages').onmessage = (e) => {
      const { type, path } = e.data || {};
      if (type === 'saved' && path) cache.delete(path);
    };
  } catch { /* no channel, no invalidation — a reload still picks it up */ }
}

// Which storefront paths have a document at all. The hook is told this per
// render; the prefetcher has no React context to be told through, so the list
// is registered once on boot from the same `initialData`. A document created
// after this page loaded is not in either list until the next full load.
let knownPaths = [];

export const registerRouteAreaPaths = (paths) => {
  knownPaths = Array.isArray(paths) ? paths : [];
};

export const hasRouteArea = (pathname) => knownPaths.includes(pathname);

const loadArea = (pathname) => {
  if (!inFlight.has(pathname)) {
    inFlight.set(
      pathname,
      fetch(`/api/route-area?path=${encodeURIComponent(pathname)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const area = data?.area || null;
          cache.set(pathname, area);
          return area;
        })
        .catch(() => null)
        .finally(() => inFlight.delete(pathname)),
    );
  }
  return inFlight.get(pathname);
};

/**
 * Warms the cache the hook reads, so a navigation that follows renders the
 * blocks without a request of its own. Resolves with the document — the
 * prefetcher decides what else is worth asking for from what it says.
 *
 * @param {string} pathname
 * @returns {Promise<object|null>}
 */
export const prefetchRouteArea = (pathname) => {
  if (cache.has(pathname)) return Promise.resolve(cache.get(pathname));
  return loadArea(pathname);
};

/**
 * Returns the route-area document for a storefront path.
 *
 * A full page load already carries the document for the path it rendered, so
 * the common case costs nothing. A client-side navigation into another category
 * has to fetch — but only when that path is in the list of paths that actually
 * have a document, which every response ships. Categories nobody has edited
 * never make a request.
 *
 * `pending` tells "this route has no document" apart from "its document has
 * not arrived yet" — both give a null `doc`, so a caller whose output depends
 * on the mode has to wait for it to clear.
 *
 * @param {string} pathname
 * @param {object|null} initial   Document the server rendered this page with.
 * @param {Array<string>} knownPaths
 * @returns {{doc: object|null, pending: boolean}}
 */
export function useRouteArea(pathname, initial = null, knownPaths = []) {
  const seeded = initial && initial.path === pathname ? initial : null;
  if (seeded && isBrowser && !cache.has(pathname)) cache.set(pathname, seeded);

  const [, rerender] = useReducer((n) => n + 1, 0);

  // The list comes from the initial document and never changes during a
  // session, so reading it through a ref keeps it out of the effect's deps.
  const pathsRef = useRef(knownPaths);
  pathsRef.current = knownPaths;

  // Read the cache during render rather than mirroring it into state: after a
  // navigation the state still holds the previous path's document, and one
  // render carrying another page's blocks is one too many. On the server there
  // is no cache to read — the request brought its own document or none.
  const cached = isBrowser && cache.has(pathname);
  const doc = seeded || (cached ? cache.get(pathname) : null);
  const pending = !seeded && !cached && pathsRef.current.includes(pathname);

  useEffect(() => {
    if (cache.has(pathname) || !pathsRef.current.includes(pathname)) return undefined;
    let cancelled = false;
    loadArea(pathname).then(() => { if (!cancelled) rerender(); });
    return () => { cancelled = true; };
  }, [pathname]);

  return { doc, pending };
}

export default useRouteArea;
