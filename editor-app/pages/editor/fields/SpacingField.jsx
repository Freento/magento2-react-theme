import {useState} from 'react';
import {UI} from '../../../src/editor/Icon.jsx';
import {sideKeys, normalizeUnit, stripUnit, parseLegacyShorthand, readSpacing} from '../lib/spacing.js';

export function SpacingField({style, value, variant = 'margin', onPatch, onChange}) {
    const isPatchMode = typeof onPatch === 'function';
    const parts = isPatchMode
        ? readSpacing(style || {}, variant)
        : parseLegacyShorthand(value) || {top: '', right: '', bottom: '', left: ''};
    const keys = sideKeys(variant);
    const [linked, setLinked] = useState(false);

    const writeShorthand = (next) => {
        const vals = [next.top, next.right, next.bottom, next.left].map(
            (v) => normalizeUnit(v) || '0'
        );
        if (vals.every((v) => v === '0')) return onChange('');
        if (vals[0] === vals[1] && vals[1] === vals[2] && vals[2] === vals[3]) {
            return onChange(vals[0]);
        }
        if (vals[0] === vals[2] && vals[1] === vals[3]) {
            return onChange(`${vals[0]} ${vals[1]}`);
        }
        onChange(vals.join(' '));
    };

    const applyOne = (side, raw) => {
        const normalized = normalizeUnit(raw);
        if (isPatchMode) {
            if (linked) {
                onPatch({
                    [keys.top]: normalized || undefined,
                    [keys.right]: normalized || undefined,
                    [keys.bottom]: normalized || undefined,
                    [keys.left]: normalized || undefined,
                    [variant]: undefined,
                });
            } else {
                onPatch({
                    [keys[side]]: normalized || undefined,
                    [variant]: undefined,
                });
            }
        } else {
            const next = linked
                ? {top: raw, right: raw, bottom: raw, left: raw}
                : {...parts, [side]: raw};
            writeShorthand(next);
        }
    };

    const inp = (side, title) => (
        <input
            className="spacing-input w-11 h-6 px-1 border border-transparent bg-e-surface-alt rounded-e [font-family:inherit] text-[12px] font-[inherit] text-center text-e-text outline-none transition-[background-color,border-color,box-shadow] duration-100 placeholder:text-e-text-soft hover:bg-e-surface hover:border-e-border-strong focus:bg-e-surface focus:border-e-primary focus:shadow-[0_0_0_2px_rgba(37,99,235,0.2)]"
            type="text"
            inputMode="decimal"
            placeholder="·"
            title={title}
            aria-label={title}
            value={stripUnit(parts[side])}
            onChange={(e) => applyOne(side, e.target.value)}
        />
    );

    return (
        <div className={`spacing-box spacing-box--${variant} relative w-full h-[92px] grid grid-cols-[8px_1fr_8px] grid-rows-[8px_1fr_8px] gap-1 before:content-[''] before:col-start-2 before:row-start-2 before:border before:border-dashed before:border-e-border-strong before:rounded-e before:pointer-events-none`}>
            <div className="col-start-2 row-start-1 flex items-center justify-center">{inp('top', 'Top')}</div>
            <div className="col-start-3 row-start-2 flex items-center justify-center">{inp('right', 'Right')}</div>
            <div className="col-start-2 row-start-3 flex items-center justify-center">{inp('bottom', 'Bottom')}</div>
            <div className="col-start-1 row-start-2 flex items-center justify-center">{inp('left', 'Left')}</div>
            <div className="col-start-2 row-start-2 z-[1] flex items-center justify-center">
                <button
                    type="button"
                    className={`spacing-link w-[22px] h-[22px] border-none bg-e-surface rounded-e text-e-text-soft cursor-pointer inline-flex items-center justify-center transition-[background-color,color,box-shadow] duration-100 shadow-[0_0_0_1px_#E8E8E5] hover:text-e-text hover:shadow-[0_0_0_1px_#D8D8D4] [&.active]:bg-e-primary [&.active]:text-white [&.active]:shadow-[0_0_0_1px_#0F4C5C]${linked ? ' active' : ''}`}
                    onClick={() => setLinked((v) => !v)}
                    title={linked ? 'Different sides' : 'All sides equal'}
                >
                    {linked ? <UI.Link size={14} strokeWidth={1.75}/> : <UI.Unlink size={14} strokeWidth={1.75}/>}
                </button>
            </div>
        </div>
    );
}
