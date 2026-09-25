import {useRef} from 'react';

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
        <div className="flex flex-col gap-1.5">
            <div className="segmented grid gap-0.5 p-0.5 bg-e-surface-alt rounded-e" style={{gridTemplateColumns: '1fr 1fr'}}>
                <button
                    type="button"
                    className={`segmented-item inline-flex items-center justify-center gap-1.5 min-h-[26px] py-[3px] px-2 text-[12px] font-medium text-e-text-muted bg-transparent border-none rounded-e cursor-pointer transition-all duration-100 whitespace-nowrap [&:not(.active):hover]:text-e-text [&.active]:bg-e-surface [&.active]:text-e-text [&.active]:shadow-[0_1px_2px_rgba(0,0,0,0.08)]${isNormal ? ' active' : ''}`}
                    onClick={() => onChange('normal')}
                >
                    <span>Normal</span>
                </button>
                <button
                    type="button"
                    className={`segmented-item inline-flex items-center justify-center gap-1.5 min-h-[26px] py-[3px] px-2 text-[12px] font-medium text-e-text-muted bg-transparent border-none rounded-e cursor-pointer transition-all duration-100 whitespace-nowrap [&:not(.active):hover]:text-e-text [&.active]:bg-e-surface [&.active]:text-e-text [&.active]:shadow-[0_1px_2px_rgba(0,0,0,0.08)]${!isNormal ? ' active' : ''}`}
                    onClick={() => onChange(`${lastPxRef.current}px`)}
                >
                    <span>Custom</span>
                </button>
            </div>
            {!isNormal && (
                <label className="flex items-center gap-1.5 bg-e-surface border border-e-border rounded-e px-2 h-7 transition-colors duration-100 hover:border-e-border-strong focus-within:border-e-primary focus-within:shadow-[0_0_0_2px_rgba(59,130,246,0.18)]">
                    <input
                        type="number"
                        step="0.1"
                        className="flex-1 min-w-0 h-full border-none outline-none bg-transparent [font-family:inherit] text-[12px] text-e-text text-right p-0 [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:[-webkit-appearance:none] [&::-webkit-inner-spin-button]:[-webkit-appearance:none]"
                        value={parsedPx ?? 0}
                        onChange={(e) => {
                            const n = e.target.value === '' ? 0 : Number(e.target.value);
                            lastPxRef.current = n;
                            onChange(`${n}px`);
                        }}
                    />
                    <span className="shrink-0 text-[11px] text-e-text-soft">px</span>
                </label>
            )}
        </div>
    );
}
