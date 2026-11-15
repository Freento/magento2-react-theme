import {useEffect, useState} from 'react';
import {fieldInputCore, sliderField} from '../lib/cls.js';

export function SliderField({value, min = 0, max = 1, step = 0.01, suffix, onChange}) {
    const parsed = parseFloat(value);
    const num = Number.isFinite(parsed) ? parsed : min;
    const [draft, setDraft] = useState(String(num));

    useEffect(() => {
        setDraft(String(num));
    }, [num]);

    const clamp = (n) => Math.min(max, Math.max(min, n));

    const handleDraft = (raw) => {
        setDraft(raw);
        const n = parseFloat(raw);
        if (Number.isFinite(n) && n >= min && n <= max) onChange(n);
    };

    const commitDraft = () => {
        const n = parseFloat(draft);
        const next = Number.isFinite(n) ? clamp(n) : num;
        setDraft(String(next));
        if (next !== num) onChange(next);
    };

    return (
        <div className="slider-number-field flex items-center gap-2">
            <div className={`${sliderField} flex-1 min-w-0`}>
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={num}
                    onChange={(e) => onChange(clamp(parseFloat(e.target.value)))}
                />
            </div>
            <input
                className={`${fieldInputCore} slider-number-input h-[30px] px-2 w-14 shrink-0 text-right`}
                type="number"
                min={min}
                max={max}
                step={step}
                value={draft}
                onChange={(e) => handleDraft(e.target.value)}
                onBlur={commitDraft}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') commitDraft();
                }}
            />
            {suffix && (
                <span className="slider-number-suffix shrink-0 text-[12px] text-ed-text-soft">{suffix}</span>
            )}
        </div>
    );
}
