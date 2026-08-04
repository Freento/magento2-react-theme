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
            className="spacing-input"
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
        <div className={`spacing-box spacing-box--${variant}`}>
            <div className="spacing-box-top">{inp('top', 'Top')}</div>
            <div className="spacing-box-right">{inp('right', 'Right')}</div>
            <div className="spacing-box-bottom">{inp('bottom', 'Bottom')}</div>
            <div className="spacing-box-left">{inp('left', 'Left')}</div>
            <div className="spacing-box-center">
                <button
                    type="button"
                    className={`spacing-link${linked ? ' active' : ''}`}
                    onClick={() => setLinked((v) => !v)}
                    title={linked ? 'Different sides' : 'All sides equal'}
                >
                    {linked ? <UI.Link size={14} strokeWidth={1.75}/> : <UI.Unlink size={14} strokeWidth={1.75}/>}
                </button>
            </div>
        </div>
    );
}
