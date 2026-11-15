import {useRef} from 'react';
import {segmentedWrap, segmentedItem} from '../lib/cls.js';

export function LetterSpacingField({value, onChange}) {
    const isNormal = !value || value === 'normal' || value === '';
    const lastPxRef = useRef(0);
    const parsedPx = (() => {
        if (isNormal) return null;
        const m = String(value).match(/-?\d*\.?\d+/);
        return m ? Number(m[0]) : null;
    })();
    if (parsedPx !== null) lastPxRef.current = parsedPx;

    return (
        <div className="letterspacing-field flex flex-col gap-1.5">
            <div className={segmentedWrap} style={{gridTemplateColumns: '1fr 1fr'}}>
                <button
                    type="button"
                    className={segmentedItem(isNormal)}
                    onClick={() => onChange('normal')}
                >
                    <span>Normal</span>
                </button>
                <button
                    type="button"
                    className={segmentedItem(!isNormal)}
                    onClick={() => onChange(`${lastPxRef.current}px`)}
                >
                    <span>Custom</span>
                </button>
            </div>
            {!isNormal && (
                <label className="letterspacing-field-input flex items-center gap-1.5 bg-ed-surface border border-solid border-ed-border rounded px-2 h-7 [transition:border-color_0.1s] hover:border-ed-border-strong focus-within:border-ed-primary focus-within:shadow-[0_0_0_2px_rgba(15,76,92,0.18)]">
                    <input
                        className="ed-no-spin flex-1 min-w-0 h-full border-none outline-none bg-transparent [font-family:inherit] text-[12px] text-ed-text text-right p-0"
                        type="number"
                        step="0.1"
                        value={parsedPx ?? 0}
                        onChange={(e) => {
                            const n = e.target.value === '' ? 0 : Number(e.target.value);
                            lastPxRef.current = n;
                            onChange(`${n}px`);
                        }}
                    />
                    <span className="letterspacing-field-suffix flex-none text-[11px] text-ed-text-soft">px</span>
                </label>
            )}
        </div>
    );
}
