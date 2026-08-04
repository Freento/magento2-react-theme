import { useEffect, useState } from 'react';

export const BREAKPOINTS = { tablet: 1024, mobile: 640 };
export function activeDevicesFromWidth(w) {
  const devices = [];
  if (w <= BREAKPOINTS.tablet) devices.push('tablet');
  if (w <= BREAKPOINTS.mobile) devices.push('mobile');
  return devices;
}

function widthForHint(hint) {
  if (hint === 'mobile') return BREAKPOINTS.mobile;
  if (hint === 'tablet') return BREAKPOINTS.tablet;
  return 1920;
}

export function useActiveDevices(forced, ssrHint) {
  const [width, setWidth] = useState(() => widthForHint(ssrHint));
  useEffect(() => {
    if (forced) return;
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    setWidth(window.innerWidth);
    return () => window.removeEventListener('resize', onResize);
  }, [forced]);
  if (forced === 'mobile') return ['tablet', 'mobile'];
  if (forced === 'tablet') return ['tablet'];
  if (forced === 'desktop') return [];
  return activeDevicesFromWidth(width);
}

export function resolveBlockForDevices(block, devices) {
  const rp = block.responsive || {};
  const props = { ...(block.props || {}) };
  const style = { ...(block.style || {}) };
  for (const d of devices) {
    const over = rp[d];
    if (!over) continue;
    if (over.props) Object.assign(props, over.props);
    if (over.style) Object.assign(style, over.style);
  }
  return { ...block, props, style };
}
