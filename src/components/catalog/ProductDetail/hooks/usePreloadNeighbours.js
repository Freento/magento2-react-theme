import { useEffect, useRef } from 'react';
import { whenFirstImageReady } from '../../../../lib/firstImageGate';

export default function usePreloadNeighbours(urls, index) {
  const preloaded = useRef(new Set());
  const key = urls.join('|');

  useEffect(() => {
    const len = urls.length;
    if (len < 2) return undefined;
    let cancelled = false;
    whenFirstImageReady().then(() => {
      if (cancelled) return;
      [(index + 1) % len, (index - 1 + len) % len].forEach((i) => {
        const url = urls[i];
        if (!url || preloaded.current.has(url)) return;
        preloaded.current.add(url);
        new Image().src = url;
      });
    });
    return () => { cancelled = true; };
  }, [index, key]);
}
