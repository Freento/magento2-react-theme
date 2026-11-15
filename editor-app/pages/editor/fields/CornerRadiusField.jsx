import {UI} from '../../../src/editor/Icon.jsx';
import {sliderField} from '../lib/cls.js';

const SLIDER_MAX = {px: 100, '%': 50};

export function CornerRadiusField({value, onChange}) {
    const parsed = (() => {
        if (value === '' || value == null) return {num: 0, unit: 'px'};
        const str = String(value).trim();
        const m = str.match(/^(-?\d*\.?\d+)\s*(px|%)?$/i);
        if (!m) return {num: 0, unit: 'px'};
        return {num: Number(m[1]), unit: (m[2] || 'px').toLowerCase()};
    })();
    const emit = (num, unit) => onChange(`${num}${unit}`);
    const sliderMax = SLIDER_MAX[parsed.unit] || SLIDER_MAX.px;
    return (
        <div className="corner-radius-slider flex items-center gap-2">
            <div className={`${sliderField} flex-1 min-w-0`}>
                <input
                    type="range"
                    min={0}
                    max={sliderMax}
                    step={1}
                    value={Math.min(sliderMax, Math.max(0, parsed.num))}
                    onChange={(e) => emit(Number(e.target.value), parsed.unit)}
                    aria-label="Corner radius"
                />
            </div>
            <label className="corner-radius-field w-[92px] shrink-0 flex items-center gap-1.5 bg-ed-surface border border-solid border-ed-border rounded pl-2 pr-1 h-7 [transition:border-color_0.1s] hover:border-ed-border-strong focus-within:border-ed-primary focus-within:shadow-[0_0_0_2px_rgba(15,76,92,0.18)]">
          <span className="corner-radius-field-icon flex-none inline-flex text-ed-text-soft" aria-hidden="true">
            <UI.CornerRadius size={14} strokeWidth={1.75}/>
          </span>
                <input
                    className="ed-no-spin flex-1 min-w-0 h-full border-none outline-none bg-transparent [font-family:inherit] text-[12px] text-ed-text text-right p-0"
                    type="number"
                    min={0}
                    step={1}
                    value={parsed.num}
                    onChange={(e) => emit(e.target.value === '' ? 0 : Number(e.target.value), parsed.unit)}
                />
                <button
                    type="button"
                    className="corner-radius-field-unit flex-none h-[22px] min-w-7 px-1.5 bg-ed-surface-hover border-none rounded text-[11px] font-semibold text-ed-text-soft lowercase cursor-pointer [transition:background_0.1s,color_0.1s] hover:bg-ed-surface-hover-strong hover:text-ed-text"
                    onClick={() => emit(parsed.num, parsed.unit === 'px' ? '%' : 'px')}
                    aria-label={`Unit: ${parsed.unit}. Click to toggle.`}
                >
                    {parsed.unit}
                </button>
            </label>
        </div>
    );
}
