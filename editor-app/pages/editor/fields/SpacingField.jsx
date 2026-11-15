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

    const applyAll = (raw) => {
        const normalized = normalizeUnit(raw);
        if (isPatchMode) {
            onPatch({
                [keys.top]: normalized || undefined,
                [keys.right]: normalized || undefined,
                [keys.bottom]: normalized || undefined,
                [keys.left]: normalized || undefined,
                [variant]: undefined,
            });
        } else {
            writeShorthand({top: raw, right: raw, bottom: raw, left: raw});
        }
    };
    const toggleLinked = () => {
        const next = !linked;
        setLinked(next);
        if (!next) return;
        const seed = parts.top || parts.right || parts.bottom || parts.left;
        if (seed) applyAll(stripUnit(seed));
    };

    const inp = (side, title) => (
        <input
            className={`spacing-input w-11 h-6 px-1 border border-solid border-ed-border bg-ed-surface rounded text-[12px] [font-family:inherit] text-center text-ed-text outline-none [transition:background-color_0.1s,border-color_0.1s,box-shadow_0.1s] placeholder:text-ed-text-soft hover:bg-ed-surface hover:border-[#B4B4AF] focus:bg-ed-surface focus:border-ed-primary focus:shadow-[0_0_0_2px_rgba(15,76,92,0.18)]`}
            type="text"
            inputMode="decimal"
            placeholder="·"
            data-tooltip={title}
            aria-label={title}
            value={stripUnit(parts[side])}
            onChange={(e) => applyOne(side, e.target.value)}
        />
    );

    const linkButton = (
        <button
            type="button"
            className={
                'spacing-link w-[22px] h-[22px] border-none rounded cursor-pointer inline-flex items-center justify-center ' +
                '[transition:background-color_0.1s,color_0.1s,box-shadow_0.1s] ' +
                (linked
                    ? 'active bg-ed-primary text-white shadow-[0_0_0_1px_#0F4C5C]'
                    : 'bg-ed-surface text-ed-text-soft shadow-[0_0_0_1px_#E8E8E5] hover:text-ed-text hover:shadow-[0_0_0_1px_#D8D8D4]')
            }
            onClick={toggleLinked}
            data-tooltip={linked ? 'Different sides' : 'All sides equal'} aria-label={linked ? 'Different sides' : 'All sides equal'}
        >
            {linked ? <UI.Lock size={13} strokeWidth={1.75}/> : <UI.LockOpen size={13} strokeWidth={1.75}/>}
        </button>
    );

    return (
        <div
            className={`spacing-box spacing-box--${variant} relative w-full h-[60px] px-[18px] grid grid-cols-[8px_1fr_8px] grid-rows-[8px_1fr_8px] gap-1 bg-transparent border-none before:content-[''] before:[grid-column:2] before:[grid-row:2] before:border before:border-dashed before:border-ed-border-strong before:rounded before:pointer-events-none`}
        >
            <div className="spacing-box-top col-start-2 row-start-1 flex items-center justify-center">{inp('top', 'Top')}</div>
            <div className="spacing-box-right col-start-3 row-start-2 flex items-center justify-center">{inp('right', 'Right')}</div>
            <div className="spacing-box-bottom col-start-2 row-start-3 flex items-center justify-center">{inp('bottom', 'Bottom')}</div>
            <div className="spacing-box-left col-start-1 row-start-2 flex items-center justify-center">{inp('left', 'Left')}</div>
            <div className="spacing-box-center col-start-2 row-start-2 z-[1] flex items-center justify-center">
                {linkButton}
            </div>
        </div>
    );
}
