import { useSyncExternalStore } from 'react';

let targets = [];
let search = null;
const listeners = new Set();

/**
 * Sets the lookup that finds categories and products for a typed text, so the
 * editor package can query the store without editor-core knowing about it.
 *
 * @param {((query: string) => Promise<{group: string, title: string, path: string}[]>)|null} fn
 * @returns {void}
 */
export function setLinkSearch(fn) {
  search = typeof fn === 'function' ? fn : null;
}

/**
 * The lookup set by `setLinkSearch`, if any.
 *
 * @returns {((query: string) => Promise<{group: string, title: string, path: string}[]>)|null}
 */
export const getLinkSearch = () => search;

/**
 * Sets the site pages offered as link targets while typing a link.
 *
 * @param {{title: string, path: string}[]} list
 * @returns {void}
 */
export function setLinkTargets(list) {
  targets = Array.isArray(list) ? list.filter((t) => t && t.path) : [];
  listeners.forEach((l) => l());
}

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/**
 * The link targets, re-rendering when the editor's page list changes.
 *
 * @returns {{title: string, path: string}[]}
 */
export const useLinkTargets = () => useSyncExternalStore(subscribe, () => targets, () => targets);

/**
 * Link targets whose title or path contain the typed text; all of them while
 * nothing is typed. A target equal to the text itself is left out.
 *
 * @param {{title: string, path: string}[]} list
 * @param {string} query
 * @param {number} [limit]
 * @returns {{title: string, path: string}[]}
 */
export function filterLinkTargets(list, query, limit = 8) {
  const q = String(query || '').trim().toLowerCase();
  return list
    .filter((t) => t.path.toLowerCase() !== q)
    .filter((t) => !q || t.path.toLowerCase().includes(q) || String(t.title || '').toLowerCase().includes(q))
    .slice(0, limit);
}
