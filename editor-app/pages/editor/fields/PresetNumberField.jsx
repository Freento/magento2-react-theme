import {useEffect, useRef, useState} from 'react';
import {UI} from '../../../src/editor/Icon.jsx';
import {fieldInputCore} from '../lib/cls.js';

export function PresetNumberField({value, presets = [1, 2, 3, 4, 5], min = 1, max = 12, onChange}) {
    const n = Math.max(min, Math.min(max, Number(value) || min));
    const custom = !presets.includes(n);
    const [editing, setEditing] = useState(false);
    const showInput = editing || custom;
    const inputRef = useRef(null);
    useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
    const set = (v) => onChange(Math.max(min, Math.min(max, v)));
    const item = (active) =>
        'preset-item inline-flex items-center justify-center min-h-[26px] px-1 text-[12px] font-medium rounded cursor-pointer ' +
        '[transition:background-color_0.1s,color_0.1s] ' +
        (active
            ? 'bg-ed-primary text-white'
            : 'bg-transparent text-ed-text hover:bg-ed-surface-hover');
    return (
        <div className="preset-number flex items-center gap-1.5">
            <div
                className="preset-group grid flex-1 gap-0.5 p-0.5 bg-ed-surface border border-solid border-ed-border rounded"
                style={{gridTemplateColumns: `repeat(${presets.length + 1}, 1fr)`}}
            >
                {presets.map((p) => (
                    <button
                        key={p}
                        type="button"
                        className={`${item(!showInput && n === p)} border-none`}
                        onClick={() => { setEditing(false); set(p); }}
                    >
                        {p}
                    </button>
                ))}
                <button
                    type="button"
                    className={`${item(showInput)} border-none`}
                    data-tooltip="Enter a number"
                    aria-label="Enter a number"
                    onClick={() => setEditing(true)}
                >
                    <UI.Edit size={13} strokeWidth={1.75}/>
                </button>
            </div>
            {showInput && (
                <input
                    className={`${fieldInputCore} w-14 h-[30px] px-2 text-center !bg-ed-surface !border-ed-border focus:!border-ed-primary`}
                    type="number"
                    min={min}
                    max={max}
                    value={n}
                    ref={inputRef}
                    onChange={(e) => { if (e.target.value !== '') set(Number(e.target.value)); }}
                />
            )}
        </div>
    );
}
