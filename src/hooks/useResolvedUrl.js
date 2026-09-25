import { useLocation } from 'react-router-dom';

/**
 * Returns the catalog entity a storefront URL resolves to, or `null`.
 *
 * Resolution always happens on the Node server: a full page load carries the
 * result in `window.__INITIAL_DATA__.resolvedUrl`, a client-side navigation
 * carries it in the link's router state. The browser never resolves URLs itself,
 * so this hook only reads what is already there — it never loads or errors.
 *
 * @param {string} urlPath
 * @returns {object|null}
 */
const STORAGE_KEY = 'resolvedUrls';
const isBrowser = typeof window !== 'undefined';

const readStore = () => {
  try {
    return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || '{}') || {};
  } catch {
    return {};
  }
};

const remember = (path, data) => {
  if (!isBrowser || !data) return;
  try {
    const store = readStore();
    if (store[path]) return;
    store[path] = data;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    return;
  }
};

const recall = (path) => (isBrowser ? readStore()[path] || null : null);

export function useResolvedUrl(urlPath) {
  const location = useLocation();
  const requestPath = (urlPath || '').replace(/^\/+/, '');

  const pageFromClickedLink = location.state?.resolved;
  if (pageFromClickedLink?.path === requestPath) {
    remember(requestPath, pageFromClickedLink);
    return pageFromClickedLink;
  }

  if (isBrowser) {
    const resolvedUrlFromServer = window.__INITIAL_DATA__?.resolvedUrl; // { path, data: page }
    if (resolvedUrlFromServer?.path === requestPath) {
      remember(requestPath, resolvedUrlFromServer.data);
      return resolvedUrlFromServer.data;
    }
  }

  return recall(requestPath);
}