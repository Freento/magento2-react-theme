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
        <div className="color-popup">
            <div
                ref={svRef}
                className="color-popup-sv"
                style={{'--hue': hueCss}}
                onPointerDown={onSvDrag}
            >
                <div
                    className="color-popup-sv-thumb"
                    style={{left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`}}
                />
            </div>
            <div className="color-popup-row">
                <button
                    type="button"
                    className="color-popup-eyedropper"
                    onClick={onPick}
                    data-tooltip="Pick from page"
                    aria-label="Eyedropper"
                >
                    <UI.Pipette size={14} strokeWidth={1.75}/>
                </button>
                <div ref={hueRef} className="color-popup-hue" onPointerDown={onHueDrag}>
                    <div className="color-popup-hue-thumb" style={{left: `${(hsv.h / 360) * 100}%`}}/>
                </div>
            </div>
            {swatches.length > 0 && (
                <div className="color-popup-swatches">
                    {swatches.map((c) => {
                        const parsed = parseColor(c);
                        const active = parsed.hex6 === hex6;
                        return (
                            <button
                                key={c}
                                type="button"
                                className={`color-popup-swatch${active ? ' active' : ''}`}
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
        <div className="color-field">
            <button
                ref={swatchRef}
                type="button"
                className="color-field-swatch"
                style={{background: hex6 ? '#' + hex6 : '#ffffff'}}
                onClick={() => setOpen((o) => !o)}
                aria-label="Open color picker"
            />
            <input
                className="field-input color-field-text"
                type="text"
                value={hexLocal}
                placeholder="000000"
                onChange={(e) => onHexInput(e.target.value)}
                spellCheck={false}
            />
            <label className="color-field-alpha">
                <span className="color-field-alpha-label">Opacity</span>
                <input
                    type="text"
                    inputMode="numeric"
                    value={alphaLocal}
                    aria-label="Opacity (%)"
                    onChange={(e) => onAlphaInput(e.target.value)}
                />
                <span className="color-field-alpha-suffix">%</span>
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
