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
        <label className="corner-radius-field">
      <span className="corner-radius-field-icon" aria-hidden="true">
        <UI.CornerRadius size={14} strokeWidth={1.75}/>
      </span>
            <input
                type="number"
                min={0}
                step={1}
                value={parsed.num}
                onChange={(e) => emit(e.target.value === '' ? 0 : Number(e.target.value), parsed.unit)}
            />
            <button
                type="button"
                className="corner-radius-field-unit"
                onClick={() => emit(parsed.num, parsed.unit === 'px' ? '%' : 'px')}
                aria-label={`Unit: ${parsed.unit}. Click to toggle.`}
            >
                {parsed.unit}
            </button>
        </label>
    );
}
