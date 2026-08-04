export function sideKeys(variant) {
    return {
        top: `${variant}Top`,
        right: `${variant}Right`,
        bottom: `${variant}Bottom`,
        left: `${variant}Left`,
    };
}

export function normalizeUnit(v) {
    const s = String(v ?? '').trim();
    if (!s) return '';
    if (/^-?\d+(\.\d+)?$/.test(s)) return `${s}px`;
    return s;
}

export function stripUnit(v) {
    return String(v ?? '').replace(/px$/, '');
}

export function parseLegacyShorthand(value) {
    const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return null;
    const [t, r = t, b = t, l = r] = parts;
    return {top: t, right: r, bottom: b, left: l};
}

export function readSpacing(style, variant) {
    const keys = sideKeys(variant);
    const has = (k) => style && style[k] != null && style[k] !== '';
    if (has(keys.top) || has(keys.right) || has(keys.bottom) || has(keys.left)) {
        return {
            top: style[keys.top] ?? '',
            right: style[keys.right] ?? '',
            bottom: style[keys.bottom] ?? '',
            left: style[keys.left] ?? '',
        };
    }
    const legacy = parseLegacyShorthand(style?.[variant]);
    return legacy || {top: '', right: '', bottom: '', left: ''};
}
