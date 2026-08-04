import {UI} from '../../../src/editor/Icon.jsx';

export function Segmented({value, options, onChange, cols}) {
    const trackCount = cols || options.length;
    return (
        <div className="segmented" style={{gridTemplateColumns: `repeat(${trackCount}, 1fr)`}}>
            {options.map((raw) => {
                const o = typeof raw === 'string' ? {value: raw, label: raw} : raw;
                const Ico = o.icon && UI[o.icon];
                const tooltip = o.title || o.label || o.value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        className={`segmented-item${value === o.value ? ' active' : ''}`}
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
