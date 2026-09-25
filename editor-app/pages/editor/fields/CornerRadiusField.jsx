import {UI} from '../../../src/editor/Icon.jsx';

export function CornerRadiusField({value, onChange}) {
    const parsed = (() => {
        if (value === '' || value == null) return {num: 0, unit: 'px'};
        const str = String(value).trim();
        const m = str.match(/^(-?\d*\.?\d+)\s*(px|%)?$/i);
        if (!m) return {num: 0, unit: 'px'};
        return {num: Number(m[1]), unit: (m[2] || 'px').toLowerCase()};
    })();
    const emit = (num, unit) => onChange(`${num}${unit}`);
    return (
        <label className="flex items-center gap-1.5 bg-e-surface border border-e-border rounded-e pl-2 pr-1 h-7 transition-colors duration-100 hover:border-e-border-strong focus-within:border-e-primary focus-within:shadow-[0_0_0_2px_rgba(59,130,246,0.18)]">
      <span className="shrink-0 inline-flex text-e-text-soft" aria-hidden="true">
        <UI.CornerRadius size={14} strokeWidth={1.75}/>
      </span>
            <input
                type="number"
                min={0}
                step={1}
                className="flex-1 min-w-0 h-full border-none outline-none bg-transparent [font-family:inherit] text-[12px] text-e-text text-right p-0 [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:[-webkit-appearance:none] [&::-webkit-inner-spin-button]:[-webkit-appearance:none]"
                value={parsed.num}
                onChange={(e) => emit(e.target.value === '' ? 0 : Number(e.target.value), parsed.unit)}
            />
            <button
                type="button"
                className="shrink-0 h-[22px] min-w-[28px] px-1.5 bg-e-surface-hover border-none rounded-e text-[11px] font-semibold text-e-text-soft lowercase cursor-pointer transition-colors duration-100 hover:bg-e-surface-hover-strong hover:text-e-text"
                onClick={() => emit(parsed.num, parsed.unit === 'px' ? '%' : 'px')}
                aria-label={`Unit: ${parsed.unit}. Click to toggle.`}
            >
                {parsed.unit}
            </button>
        </label>
    );
}
