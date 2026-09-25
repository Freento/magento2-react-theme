import {UI} from '../../../src/editor/Icon.jsx';

export function Segmented({value, options, onChange, cols}) {
    const trackCount = cols || options.length;
    return (
        <div className="segmented grid gap-0.5 p-0.5 bg-e-surface-alt rounded-e" style={{gridTemplateColumns: `repeat(${trackCount}, 1fr)`}}>
            {options.map((raw) => {
                const o = typeof raw === 'string' ? {value: raw, label: raw} : raw;
                const Ico = o.icon && UI[o.icon];
                const tooltip = o.title || o.label || o.value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        className={`segmented-item inline-flex items-center justify-center gap-1.5 min-h-[26px] py-[3px] px-2 text-[12px] font-medium text-e-text-muted bg-transparent border-none rounded-e cursor-pointer transition-all duration-100 whitespace-nowrap [&:not(.active):hover]:text-e-text [&.active]:bg-e-surface [&.active]:text-e-text [&.active]:shadow-[0_1px_2px_rgba(0,0,0,0.08)]${value === o.value ? ' active' : ''}`}
                        onClick={() => onChange(o.value)}
                        data-tooltip={tooltip}
                        aria-label={tooltip}
                    >
                        {Ico ? <Ico size={14} strokeWidth={1.75}/> : null}
                        {o.label ? <span>{o.label}</span> : null}
                    </button>
                );
            })}
        </div>
    );
}
