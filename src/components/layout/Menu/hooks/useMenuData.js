import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_CATEGORIES } from '../../../../queries/menu';

const MENU_CACHE_KEY = 'simple_shop_menu_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export default function useMenuData({ isMobile, isOpen }) {
  const [cachedData, setCachedData] = useState(null);
  const [cacheChecked, setCacheChecked] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [menuReady, setMenuReady] = useState(false);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobileViewport(mq.matches);
    const fn = (e) => setIsMobileViewport(e.matches);
    mq.addEventListener?.('change', fn);
    return () => mq.removeEventListener?.('change', fn);
  }, []);

  // Desktop: defer the query until first user intent (or 800ms).
  useEffect(() => {
    if (menuReady || isMobile || isMobileViewport) return;
    const ready = () => setMenuReady(true);
    const timer = setTimeout(ready, 800);
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, ready, { once: true, passive: true }));
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, ready));
    };
  }, [menuReady, isMobile, isMobileViewport]);

  const skipForViewport = isMobileViewport
    ? (!isMobile || !isOpen)
    : (isMobile || !menuReady);
  const { loading, error, data } = useQuery(GET_CATEGORIES, {
    skip: !cacheChecked || cachedData !== null || skipForViewport,
  });

  useEffect(() => {
    if (data && cachedData === null) {
      localStorage.setItem(MENU_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    }
  }, [data, cachedData]);

  return { menuData: cachedData || data, loading, error };
}
