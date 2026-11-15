import {useState, useRef, useEffect, useCallback, useContext} from 'react';
import {UI} from '../../../src/editor/Icon.jsx';
import {
    parseColor,
    combineColor,
    sanitizeHex,
    hexToRgb,
    rgbToHex,
    rgbToHsv,
    hsvToRgb,
    ColorSwatchesContext,
    pickColorFromPage,
} from '../lib/color.js';
import {fieldInput} from '../lib/cls.js';

function usePointerDrag(onMove) {
    return useCallback((e) => {
        e.preventDefault();
        onMove(e.clientX, e.clientY);
        const move = (ev) => onMove(ev.clientX, ev.clientY);
        const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    }, [onMove]);
}

function ColorPopup({hex6, alpha, onChange, onPick}) {
    const swatches = useContext(ColorSwatchesContext);
    const [hsv, setHsv] = useState(() => {
        const rgb = hexToRgb(hex6) || [0, 0, 0];
        return rgbToHsv(...rgb);
    });
    useEffect(() => {
        const rgb = hexToRgb(hex6);
        if (!rgb) return;
        const next = rgbToHsv(...rgb);
        setHsv((cur) => {
            const [cr, cg, cb] = hsvToRgb(cur.h, cur.s, cur.v);
            const sameRgb =
                Math.round(cr) === rgb[0] && Math.round(cg) === rgb[1] && Math.round(cb) === rgb[2];
            return sameRgb ? cur : next;
        });
    }, [hex6]);

    const writeFromHsv = (h, s, v, a = alpha) => {
        const [r, g, b] = hsvToRgb(h, s, v);
        onChange(rgbToHex(r, g, b), a);
    };

    const svRef = useRef(null);
    const onSvDrag = usePointerDrag((x, y) => {
        const r = svRef.current?.getBoundingClientRect();
        if (!r) return;
        const s = Math.max(0, Math.min(1, (x - r.left) / r.width));
        const v = 1 - Math.max(0, Math.min(1, (y - r.top) / r.height));
        setHsv((cur) => ({...cur, s, v}));
        writeFromHsv(hsv.h, s, v);
    });

    const hueRef = useRef(null);
    const onHueDrag = usePointerDrag((x) => {
        const r = hueRef.current?.getBoundingClientRect();
        if (!r) return;
        const h = Math.max(0, Math.min(1, (x - r.left) / r.width)) * 360;
        setHsv((cur) => ({...cur, h}));
        writeFromHsv(h, hsv.s, hsv.v);
    });

    // Background colors for the gradients
    const [hueR, hueG, hueB] = hsvToRgb(hsv.h, 1, 1);
    const hueCss = `rgb(${Math.round(hueR)},${Math.round(hueG)},${Math.round(hueB)})`;

    return (
        <div className="color-popup absolute top-[calc(100%+8px)] left-0 z-[1000] w-60 p-2.5 bg-ed-surface border border-solid border-ed-border rounded shadow-[0_12px_32px_rgba(0,0,0,0.14),0_2px_6px_rgba(0,0,0,0.06)] flex flex-col gap-2.5 select-none">
            <div
                ref={svRef}
                className="color-popup-sv relative w-full h-[140px] rounded cursor-crosshair touch-none bg-[linear-gradient(to_bottom,rgba(0,0,0,0),rgba(0,0,0,1)),linear-gradient(to_right,rgba(255,255,255,1),var(--hue,#f00))] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]"
                style={{'--hue': hueCss}}
                onPointerDown={onSvDrag}
            >
                <div
                    className="color-popup-sv-thumb absolute w-3 h-3 rounded-full border-2 border-solid border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35),0_1px_3px_rgba(0,0,0,0.35)] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`}}
                />
            </div>
            <div className="color-popup-row flex items-center gap-2.5">
                <button
                    type="button"
                    className="color-popup-eyedropper w-7 h-7 shrink-0 border-none rounded bg-transparent cursor-pointer text-ed-text-muted inline-flex items-center justify-center [transition:background-color_0.1s,color_0.1s] hover:bg-ed-bg hover:text-ed-primary"
                    onClick={onPick}
                    data-tooltip="Pick from page"
                    aria-label="Eyedropper"
                >
                    <UI.Pipette size={14} strokeWidth={1.75}/>
                </button>
                <div
                    ref={hueRef}
                    className="color-popup-hue relative flex-1 min-w-0 h-2.5 rounded-pill cursor-pointer touch-none bg-[linear-gradient(to_right,#f00_0%,#ff0_17%,#0f0_33%,#0ff_50%,#00f_67%,#f0f_83%,#f00_100%)]"
                    onPointerDown={onHueDrag}
                >
                    <div
                        className="color-popup-hue-thumb absolute top-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-solid border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35),0_1px_3px_rgba(0,0,0,0.35)] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        style={{left: `${(hsv.h / 360) * 100}%`}}
                    />
                </div>
            </div>
            {swatches.length > 0 && (
                <div className="color-popup-swatches grid grid-cols-8 gap-1 pt-1 border-t border-solid border-ed-border">
                    {swatches.map((c) => {
                        const parsed = parseColor(c);
                        const active = parsed.hex6 === hex6;
                        return (
                            <button
                                key={c}
                                type="button"
                                className={
                                    'color-popup-swatch relative aspect-square rounded border-none p-0 cursor-pointer ' +
                                    '[transition:transform_0.08s_ease,box-shadow_0.08s_ease] hover:scale-[1.06] ' +
                                    (active
                                        ? 'active shadow-[inset_0_0_0_1px_#fff,0_0_0_2px_#0F4C5C]'
                                        : 'shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] hover:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)]')
                                }
                                style={{background: '#' + parsed.hex6}}
                                onClick={() => onChange(parsed.hex6, alpha)}
                                data-tooltip={'#' + parsed.hex6}
                                aria-label={`Use ${c}`}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

const themeColor = (name) => {
    if (typeof document === 'undefined') return '';
    const docs = [document, ...[...document.querySelectorAll('iframe')].map((f) => {
        try { return f.contentDocument; } catch { return null; }
    })].filter(Boolean);
    for (const doc of docs) {
        const v = getComputedStyle(doc.documentElement).getPropertyValue(name).trim();
        if (v) return v;
    }
    return '';
};

const resolveFallback = (fallback) => {
    const m = /^var\((--[\w-]+)\)$/.exec(String(fallback || '').trim());
    return m ? themeColor(m[1]) : fallback;
};

const CHECKER = 'repeating-conic-gradient(#d9d9d6 0 25%, #ffffff 0 50%)';
const swatchStyle = (hex, alpha) => {
    const rgb = hexToRgb(hex);
    const tint = rgb ? `rgba(${rgb.join(', ')}, ${alpha})` : '#' + hex;
    return {
        backgroundImage: `linear-gradient(${tint}, ${tint}), ${CHECKER}`,
        backgroundSize: '100% 100%, 8px 8px',
    };
};

export function ColorField({value, onChange, fallback}) {
    const fallbackHex = parseColor(resolveFallback(fallback) || '').hex6;
    const {hex6, alpha} = parseColor(value);
    const shown = (v) => (/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(String(v || '').trim()) ? parseColor(v).hex6 : String(v || ''));
    const [textLocal, setTextLocal] = useState(shown(value));
    const [alphaLocal, setAlphaLocal] = useState(String(Math.round(alpha * 100)));
    const [open, setOpen] = useState(false);
    const popupRef = useRef(null);
    const swatchRef = useRef(null);

    useEffect(() => {
        setTextLocal(shown(value));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);
    useEffect(() => {
        setAlphaLocal(String(Math.round(alpha * 100)));
    }, [alpha]);

    useEffect(() => {
        if (!open) return;
        const onDown = (e) => {
            if (popupRef.current?.contains(e.target)) return;
            if (swatchRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const write = (nextHex, nextAlpha) => onChange(combineColor(nextHex, nextAlpha));

    const onTextInput = (raw) => {
        setTextLocal(raw);
        const text = raw.trim();
        if (text === '') { onChange(''); return; }
        if (/^#?[0-9a-f]{1,6}$/i.test(text)) {
            const clean = sanitizeHex(text);
            if (clean.length === 6) write(clean, alpha);
            return;
        }
        onChange(text);
    };
    const isHexValue = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(String(value || '').trim());
    const writeAlpha = (nextAlpha) => {
        if (isHexValue || !value) { write(hex6 || fallbackHex || '000000', nextAlpha); return; }
        const rgb = hexToRgb(hex6);
        if (!rgb) return;
        onChange(nextAlpha >= 1 ? `rgb(${rgb.join(', ')})` : `rgba(${rgb.join(', ')}, ${Math.round(nextAlpha * 100) / 100})`);
    };
    const onAlphaInput = (raw) => {
        const cleaned = raw.replace(/[^0-9]/g, '').slice(0, 3);
        setAlphaLocal(cleaned);
        const n = Math.max(0, Math.min(100, Number(cleaned) || 0));
        if (cleaned !== '') writeAlpha(n / 100);
        else if (hex6) writeAlpha(1);
    };
    const pickColor = async () => {
        if (typeof window === 'undefined') return;
        try {
            const picked = await pickColorFromPage();
            const cleaned = sanitizeHex(picked.replace(/^#/, ''));
            if (cleaned.length === 6) write(cleaned, alpha);
        } catch {
        }
    };

    return (
        <div className="color-field relative flex items-center gap-1.5">
            <button
                ref={swatchRef}
                type="button"
                className="color-field-swatch relative w-[22px] h-[22px] border-none p-0 rounded shrink-0 cursor-pointer overflow-hidden shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)] [transition:box-shadow_0.1s,transform_0.05s] hover:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)] active:scale-95"
                style={swatchStyle(hex6 || fallbackHex || 'ffffff', hex6 ? alpha : 1)}
                onClick={() => setOpen((o) => !o)}
                aria-label="Open color picker"
            />
            <input
                className={`${fieldInput} color-field-text flex-1 min-w-0 font-ed-mono tracking-[0.04em]`}
                type="text"
                value={textLocal}
                placeholder={fallbackHex || '000000'}
                onChange={(e) => onTextInput(e.target.value)}
                spellCheck={false}
            />
            <label className="color-field-alpha flex items-center gap-1.5 px-2 h-[30px] w-[110px] shrink-0 bg-ed-surface border border-solid border-ed-border rounded [transition:background-color_0.1s,border-color_0.1s,box-shadow_0.1s] cursor-text hover:bg-ed-surface hover:border-ed-border-strong focus-within:bg-ed-surface focus-within:border-ed-primary focus-within:shadow-[0_0_0_2px_rgba(15,76,92,0.18)]">
                <span className="color-field-alpha-label text-[10.5px] font-medium text-ed-text-soft uppercase tracking-[0.04em] shrink-0">Opacity</span>
                <input
                    className="flex-1 min-w-0 border-0 outline-none bg-transparent [font-family:inherit] text-[12px] text-ed-text text-right p-0"
                    type="text"
                    inputMode="numeric"
                    value={alphaLocal}
                    placeholder="100"
                    aria-label="Opacity (%)"
                    onChange={(e) => onAlphaInput(e.target.value)}
                    onBlur={() => setAlphaLocal(String(Math.round(alpha * 100)))}
                />
                <span className="color-field-alpha-suffix text-[11px] text-ed-text-soft shrink-0">%</span>
            </label>
            {open && (
                <div ref={popupRef}>
                    <ColorPopup
                        hex6={hex6 || fallbackHex}
                        alpha={alpha}
                        onChange={(nextHex, nextAlpha) => write(nextHex, nextAlpha)}
                        onPick={pickColor}
                    />
                </div>
            )}
        </div>
    );
}
