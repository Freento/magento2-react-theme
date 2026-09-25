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
        <div ref={wrapRef} className={`fw-field group/fw relative${open ? ' open' : ''}`}>
            <button
                type="button"
                className="flex items-center justify-between gap-1.5 w-full h-7 px-2 bg-e-surface border border-e-border rounded-e text-[12px] text-e-text text-left cursor-pointer transition-colors duration-100 hover:border-e-border-strong group-[.open]/fw:border-e-primary group-[.open]/fw:shadow-[0_0_0_2px_rgba(59,130,246,0.18)] [&>svg]:shrink-0 [&>svg]:text-e-text-soft"
                onClick={() => setOpen((o) => !o)}
            >
                <span style={{fontFamily: current.value}}>{current.label}</span>
                <UI.ChevronDown size={14} strokeWidth={1.75}/>
            </button>
            {open && (
                <div className="absolute z-[200] left-0 right-0 top-[calc(100%+4px)] flex flex-col gap-px p-1 bg-e-surface border border-e-border rounded-e-xl shadow-[0_10px_28px_rgba(15,23,42,0.18)] max-h-[280px] overflow-y-auto" role="listbox">
                    {FONT_FAMILY_OPTIONS.map((opt) => {
                        const active = opt.value === current.value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                role="option"
                                aria-selected={active}
                                className={`flex items-center gap-1.5 w-full h-7 pl-1 pr-2 bg-transparent border-none rounded-e text-[12.5px] text-e-text text-left cursor-pointer hover:bg-e-surface-hover [&.active]:text-e-primary${active ? ' active' : ''}`}
                                onClick={() => {
                                    onChange(opt.value);
                                    setOpen(false);
                                }}
                            >
                <span className="shrink-0 basis-4 inline-flex items-center justify-center text-e-primary">
                  {active && <UI.Check size={13} strokeWidth={2.25}/>}
                </span>
                                <span className="flex-1 min-w-0 truncate" style={{fontFamily: opt.value}}>
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
