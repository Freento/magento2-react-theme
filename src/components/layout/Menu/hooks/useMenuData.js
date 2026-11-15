import { useState, useEffect } from 'react';
import { useQuery, useApolloClient } from '@apollo/client';
import { GET_CATEGORIES } from '../../../../queries/menu';

const MENU_CACHE_KEY = 'simple_shop_menu_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// A prerendered page carries the menu as it was at build time; one quiet
// re-fetch after load brings it up to date. Live SSR pages are fresh already.
let prerenderRefreshScheduled = false;
function scheduleMenuRefresh(client) {
  if (prerenderRefreshScheduled) return;
  prerenderRefreshScheduled = true;
  const run = () => {
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1));
    idle(() => {
      client.query({ query: GET_CATEGORIES, fetchPolicy: 'network-only' }).catch(() => {});
    }, { timeout: 5000 });
  };
  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run, { once: true });
}

export default function useMenuData({ isMobile, isOpen, disabled = false }) {
  const client = useApolloClient();
  const [ssrMenu] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return !!client.readQuery({ query: GET_CATEGORIES });
    } catch {
      return false;
    }
  });
  const [cachedData, setCachedData] = useState(null);
  const [cacheChecked, setCacheChecked] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [menuReady, setMenuReady] = useState(false);

  useEffect(() => {
    if (!disabled && ssrMenu && window.__INITIAL_DATA__?.prerendered) scheduleMenuRefresh(client);
  }, [disabled, ssrMenu, client]);

  useEffect(() => {
    if (ssrMenu) {
      setCacheChecked(true);
      return;
    }
    try {
      const raw = window.localStorage.getItem(MENU_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.timestamp < CACHE_EXPIRY) {
          setCachedData(parsed.data);
        } else {
          window.localStorage.removeItem(MENU_CACHE_KEY);
        }
      }
    } catch {
    }
    setCacheChecked(true);
  }, [ssrMenu]);

  useEffect(() => {
    if (ssrMenu || typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobileViewport(mq.matches);
    const fn = (e) => setIsMobileViewport(e.matches);
    mq.addEventListener?.('change', fn);
    return () => mq.removeEventListener?.('change', fn);
  }, [ssrMenu]);

  // Desktop: defer the query until first user intent (or 800ms).
  useEffect(() => {
    if (ssrMenu || menuReady || isMobile || isMobileViewport) return;
    const ready = () => setMenuReady(true);
    const timer = setTimeout(ready, 800);
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, ready, { once: true, passive: true }));
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, ready));
    };
  }, [ssrMenu, menuReady, isMobile, isMobileViewport]);

  // With the menu already in the cache (SSR) reading it costs nothing, so only
  // the closed drawer is skipped — the desktop menu keeps the data it was
  // rendered with instead of blanking once the viewport turns out mobile.
  const skipForViewport = isMobileViewport
    ? (!isMobile || !isOpen)
    : (isMobile || !menuReady);
  const skip = disabled || (ssrMenu
    ? (isMobile && !isOpen)
    : (!cacheChecked || cachedData !== null || skipForViewport));
  const { loading, error, data } = useQuery(GET_CATEGORIES, {
    fetchPolicy: 'cache-first',
    skip,
  });

  useEffect(() => {
    if (data && cachedData === null) {
      localStorage.setItem(MENU_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    }
  }, [data, cachedData]);

  if (disabled) return { menuData: null, loading: false, error: null };
  return { menuData: cachedData || data, loading, error };
}
