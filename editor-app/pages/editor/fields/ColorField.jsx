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
        <div className="absolute top-[calc(100%+8px)] left-0 z-[1000] w-[240px] p-2.5 bg-e-surface border border-e-border rounded-e shadow-[0_12px_32px_rgba(0,0,0,0.14),0_2px_6px_rgba(0,0,0,0.06)] flex flex-col gap-2.5 select-none">
            <div
                ref={svRef}
                className="relative w-full h-[140px] rounded-e cursor-crosshair touch-none bg-[linear-gradient(to_bottom,rgba(0,0,0,0),rgba(0,0,0,1)),linear-gradient(to_right,rgba(255,255,255,1),var(--hue,#f00))] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]"
                style={{'--hue': hueCss}}
                onPointerDown={onSvDrag}
            >
                <div
                    className="absolute w-3 h-3 rounded-full border-2 border-solid border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35),0_1px_3px_rgba(0,0,0,0.35)] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`}}
                />
            </div>
            <div className="flex items-center gap-2.5">
                <button
                    type="button"
                    className="w-7 h-7 shrink-0 border-none rounded-e bg-transparent cursor-pointer text-e-text-muted inline-flex items-center justify-center transition-colors duration-100 hover:bg-e-surface-alt hover:text-e-primary"
                    onClick={onPick}
                    data-tooltip="Pick from page"
                    aria-label="Eyedropper"
                >
                    <UI.Pipette size={14} strokeWidth={1.75}/>
                </button>
                <div ref={hueRef}
                     className="relative flex-1 min-w-0 h-2.5 rounded-full cursor-pointer touch-none bg-[linear-gradient(to_right,#f00_0%,#ff0_17%,#0f0_33%,#0ff_50%,#00f_67%,#f0f_83%,#f00_100%)]"
                     onPointerDown={onHueDrag}>
                    <div className="absolute top-1/2 w-[14px] h-[14px] rounded-full bg-white border-2 border-solid border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35),0_1px_3px_rgba(0,0,0,0.35)] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                         style={{left: `${(hsv.h / 360) * 100}%`}}/>
                </div>
            </div>
            {swatches.length > 0 && (
                <div className="grid grid-cols-8 gap-1 pt-1 border-t border-e-border">
                    {swatches.map((c) => {
                        const parsed = parseColor(c);
                        const active = parsed.hex6 === hex6;
                        return (
                            <button
                                key={c}
                                type="button"
                                className={`relative aspect-square rounded-e border-none p-0 cursor-pointer shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] transition-[transform,box-shadow] duration-[80ms] hover:scale-[1.06] hover:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)] [&.active]:!shadow-[inset_0_0_0_1px_#fff,0_0_0_2px_#0F4C5C]${active ? ' active' : ''}`}
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

export function ColorField({value, onChange}) {
    const {hex6, alpha} = parseColor(value);
    const [hexLocal, setHexLocal] = useState(hex6);
    const [alphaLocal, setAlphaLocal] = useState(String(Math.round(alpha * 100)));
    const [open, setOpen] = useState(false);
    const popupRef = useRef(null);
    const swatchRef = useRef(null);

    useEffect(() => {
        setHexLocal(hex6);
    }, [hex6]);
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

    const onHexInput = (raw) => {
        const clean = sanitizeHex(raw);
        setHexLocal(clean);
        if (clean.length === 6) write(clean, alpha);
    };
    const onAlphaInput = (raw) => {
        const cleaned = raw.replace(/[^0-9]/g, '').slice(0, 3);
        setAlphaLocal(cleaned);
        const n = Math.max(0, Math.min(100, Number(cleaned) || 0));
        if (cleaned !== '') write(hex6 || '000000', n / 100);
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
        <div className="relative flex items-center gap-1.5">
            <button
                ref={swatchRef}
                type="button"
                className="relative w-[22px] h-[22px] border-none p-0 rounded-e shrink-0 cursor-pointer shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)] overflow-hidden [transition:box-shadow_0.1s,transform_0.05s] hover:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)] active:scale-95"
                style={{background: hex6 ? '#' + hex6 : '#ffffff'}}
                onClick={() => setOpen((o) => !o)}
                aria-label="Open color picker"
            />
            <input
                className="field-input flex-1 min-w-0 !text-[12px] tracking-[0.04em] uppercase !font-['SF_Mono',ui-monospace,Menlo,monospace]"
                type="text"
                value={hexLocal}
                placeholder="000000"
                onChange={(e) => onHexInput(e.target.value)}
                spellCheck={false}
            />
            <label className="flex items-center gap-1.5 px-2 h-[30px] w-[110px] shrink-0 bg-e-surface-alt border border-transparent rounded-e transition-[background-color,border-color,box-shadow] duration-100 cursor-text hover:bg-e-surface hover:border-e-border-strong focus-within:bg-e-surface focus-within:border-e-primary focus-within:shadow-[0_0_0_2px_rgba(37,99,235,0.18)]">
                <span className="text-[10.5px] font-medium text-e-text-soft uppercase tracking-[0.04em] shrink-0">Opacity</span>
                <input
                    type="text"
                    className="flex-1 min-w-0 border-0 outline-none bg-transparent [font-family:inherit] text-[12px] text-e-text text-right p-0"
                    inputMode="numeric"
                    value={alphaLocal}
                    aria-label="Opacity (%)"
                    onChange={(e) => onAlphaInput(e.target.value)}
                />
                <span className="text-[11px] text-e-text-soft shrink-0">%</span>
            </label>
            {open && (
                <div ref={popupRef}>
                    <ColorPopup
                        hex6={hex6}
                        alpha={alpha}
                        onChange={(nextHex, nextAlpha) => write(nextHex, nextAlpha)}
                        onPick={pickColor}
                    />
                </div>
            )}
        </div>
    );
}
