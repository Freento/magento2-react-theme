import {createContext} from 'react';

export function generateId() {
    return 'b' + Math.random().toString(36).slice(2, 9);
}

export function rgbStringToHex(rgb) {
    if (!rgb) return null;
    const m = rgb.match(/(-?\d+(?:\.\d+)?)/g);
    if (!m || m.length < 3) return null;
    const [r, g, b] = m.slice(0, 3).map((n) => Math.max(0, Math.min(255, Math.round(Number(n)))));
    return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
}

export async function pickColorFromPage() {
    if (typeof window === 'undefined') throw new Error('no window');
    const html2canvas = (await import('html2canvas')).default;
    const snapshot = await html2canvas(document.body, {
        useCORS: true,
        backgroundColor: null,
        logging: false,
        scale: 1,
        x: window.scrollX,
        y: window.scrollY,
        width: window.innerWidth,
        height: window.innerHeight,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
    });
    const ctx = snapshot.getContext('2d', {willReadFrequently: true});

    return new Promise((resolve, reject) => {
        const styleEl = document.createElement('style');
        styleEl.textContent = `html, html *, html *::before, html *::after { cursor: crosshair !important; }`;
        document.head.appendChild(styleEl);

        const overlay = document.createElement('div');
        overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 2147483647;
      background: rgba(0,0,0,0.001); cursor: crosshair;
    `;
        document.body.appendChild(overlay);

        const preview = document.createElement('div');
        preview.style.cssText = `
      position: fixed; pointer-events: none; z-index: 2147483647;
      display: flex; align-items: center; gap: 8px;
      padding: 6px 10px 6px 6px;
      background: #fff;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font: 500 12px -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
      color: #0a0a0a;
      transform: translate(16px, 16px);
    `;
        const swatch = document.createElement('div');
        swatch.style.cssText = `width: 32px; height: 32px; border-radius: 6px; border: 1px solid #d1d5db;`;
        const label = document.createElement('span');
        label.style.cssText = `font-family: 'SF Mono', ui-monospace, Menlo, monospace; font-size: 12px;`;
        preview.append(swatch, label);
        document.body.appendChild(preview);

        let lastHex = '#000000';

        const pixelAt = (clientX, clientY) => {
            const data = ctx.getImageData(clientX, clientY, 1, 1).data;
            const [r, g, b] = data;
            return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
        };

        const cleanup = () => {
            overlay.remove();
            preview.remove();
            styleEl.remove();
            document.removeEventListener('keydown', onKey, true);
            window.__editorPicking = false;
        };
        const onMove = (e) => {
            preview.style.left = e.clientX + 'px';
            preview.style.top = e.clientY + 'px';
            try {
                const hex = pixelAt(e.clientX, e.clientY);
                swatch.style.background = hex;
                label.textContent = hex.toUpperCase();
                lastHex = hex;
            } catch {
            }
        };
        const onClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            cleanup();
            resolve(lastHex);
        };
        const onKey = (e) => {
            if (e.key === 'Escape') {
                cleanup();
                reject(new Error('AbortError'));
            }
        };
        overlay.addEventListener('mousemove', onMove);
        overlay.addEventListener('click', onClick);
        document.addEventListener('keydown', onKey, true);
        window.__editorPicking = true;
    });
}

export function parseColor(v) {
    if (!v) return {hex6: '', alpha: 1};
    const m = String(v).trim().match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
    if (!m) return {hex6: '', alpha: 1};
    return {
        hex6: m[1].toUpperCase(),
        alpha: m[2] ? parseInt(m[2], 16) / 255 : 1,
    };
}

export function combineColor(hex6, alpha) {
    if (!hex6) return '';
    if (alpha >= 1) return '#' + hex6;
    const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
        .toString(16).padStart(2, '0').toUpperCase();
    return '#' + hex6 + a;
}

export function sanitizeHex(raw) {
    return String(raw).replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toUpperCase();
}

export function hexToRgb(hex) {
    const clean = String(hex || '').replace(/^#/, '');
    if (!/^[0-9a-f]{6}$/i.test(clean)) return null;
    const n = parseInt(clean, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r, g, b) {
    const to = (x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0');
    return (to(r) + to(g) + to(b)).toUpperCase();
}

export function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
        if (max === r) h = ((g - b) / d) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
    }
    h = (h * 60 + 360) % 360;
    return {h, s: max === 0 ? 0 : d / max, v: max};
}

export const ColorSwatchesContext = createContext([]);

export function collectFrequentColors(pageData, limit = 8) {
    if (!pageData) return [];
    const isHex = (v) => typeof v === 'string' && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v.trim());
    const counts = new Map();
    const tally = (v) => {
        if (!isHex(v)) return;
        const norm = v.trim().toUpperCase();
        counts.set(norm, (counts.get(norm) || 0) + 1);
    };
    const visit = (b) => {
        if (!b || typeof b !== 'object') return;
        for (const v of Object.values(b.props || {})) tally(v);
        for (const v of Object.values(b.style || {})) tally(v);
        for (const child of (b.children || [])) visit(child);
    };
    for (const b of (pageData.blocks || [])) visit(b);
    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([color]) => color);
}

export function hsvToRgb(h, s, v) {
    const c = v * s;
    const hh = (h % 360) / 60;
    const x = c * (1 - Math.abs((hh % 2) - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;
    if (hh < 1) [r, g, b] = [c, x, 0];
    else if (hh < 2) [r, g, b] = [x, c, 0];
    else if (hh < 3) [r, g, b] = [0, c, x];
    else if (hh < 4) [r, g, b] = [0, x, c];
    else if (hh < 5) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}
