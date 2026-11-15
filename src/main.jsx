import './styles/tailwind.css';
import './styles/external-markup.css';
import { releaseDeferredImages } from './lib/firstImageGate';

const initialDataEl = document.getElementById('__INITIAL_DATA__');
if (initialDataEl) window.__INITIAL_DATA__ = JSON.parse(initialDataEl.textContent);

releaseDeferredImages();

let booted = false;
const boot = () => {
  if (booted) return;
  booted = true;
  import('./boot.jsx');
};

const supportsLcp = typeof PerformanceObserver !== 'undefined'
  && (PerformanceObserver.supportedEntryTypes || []).includes('largest-contentful-paint');

if (document.hidden || !document.getElementById('root')?.firstElementChild) {
  boot();
} else if (supportsLcp) {
  let settleTimer;
  const settle = () => {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      if (document.readyState === 'complete') boot();
      else addEventListener('load', settle, { once: true });
    }, 150);
  };
  new PerformanceObserver(settle).observe({ type: 'largest-contentful-paint', buffered: true });
  setTimeout(boot, 3000);
  addEventListener('pointerdown', boot, { once: true, capture: true });
  addEventListener('keydown', boot, { once: true, capture: true });
} else {
  requestAnimationFrame(() => setTimeout(boot, 0));
}
