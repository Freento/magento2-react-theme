import {useState, useRef, useEffect} from 'react';
import {UI} from '../../../src/editor/Icon.jsx';

const FONT_FAMILY_OPTIONS = [
    {label: 'Default', value: 'inherit'},
    {label: 'System', value: 'system-ui, -apple-system, sans-serif'},
    {label: 'Georgia', value: 'Georgia, serif'},
    {label: 'Times New Roman', value: "'Times New Roman', serif"},
    {label: 'Arial', value: 'Arial, sans-serif'},
    {label: 'Helvetica', value: "'Helvetica Neue', Helvetica, sans-serif"},
    {label: 'Verdana', value: 'Verdana, sans-serif'},
    {label: 'Courier New', value: "'Courier New', monospace"},
    {label: 'Monospace', value: 'ui-monospace, monospace'},
];

export function FontFamilyField({value, onChange}) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);
    const current =
        FONT_FAMILY_OPTIONS.find((f) => f.value === value) || FONT_FAMILY_OPTIONS[0];
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
                <span style={{fontFamily: current.value}}>{current.label}</span>
                <UI.ChevronDown size={14} strokeWidth={1.75}/>
            </button>
            {open && (
                <div className="fw-popup" role="listbox">
                    {FONT_FAMILY_OPTIONS.map((opt) => {
                        const active = opt.value === current.value;
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
                                <span className="fw-option-label" style={{fontFamily: opt.value}}>
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
