import {useState, useRef, useEffect} from 'react';
import {UI} from '../../../src/editor/Icon.jsx';

const FONT_WEIGHT_NAMES = [
    {value: 100, label: 'Thin'},
    {value: 200, label: 'ExtraLight'},
    {value: 300, label: 'Light'},
    {value: 400, label: 'Regular'},
    {value: 500, label: 'Medium'},
    {value: 600, label: 'SemiBold'},
    {value: 700, label: 'Bold'},
    {value: 800, label: 'ExtraBold'},
    {value: 900, label: 'Black'},
];

function normalizeFontWeight(v) {
    if (v === 'normal') return 400;
    if (v === 'bold') return 700;
    const n = Number(v);
    return Number.isFinite(n) ? n : 400;
}

export function FontWeightField({value, onChange}) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);
    const normalized = normalizeFontWeight(value);
    const current =
        FONT_WEIGHT_NAMES.find((w) => w.value === normalized) || FONT_WEIGHT_NAMES[3];
    useEffect(() => {
        if (!open) return;
        const onDocClick = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        const onEsc = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onEsc);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onEsc);
        };
    }, [open]);
    return (
        <div ref={wrapRef} className={`fw-field${open ? ' open' : ''}`}>
            <button
                type="button"
                className="fw-field-trigger"
                onClick={() => setOpen((o) => !o)}
            >
                <span style={{fontWeight: current.value}}>{current.label}</span>
                <UI.ChevronDown size={14} strokeWidth={1.75}/>
            </button>
            {open && (
                <div className="fw-popup" role="listbox">
                    {FONT_WEIGHT_NAMES.map((opt) => {
                        const active = opt.value === normalized;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                role="option"
                                aria-selected={active}
                                className={`fw-option${active ? ' active' : ''}`}
                                onClick={() => {
                                    onChange(opt.value);
                                    setOpen(false);
                                }}
                            >
                <span className="fw-option-check">
                  {active && <UI.Check size={13} strokeWidth={2.25}/>}
                </span>
                                <span className="fw-option-label" style={{fontWeight: opt.value}}>
                  {opt.label}
                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
