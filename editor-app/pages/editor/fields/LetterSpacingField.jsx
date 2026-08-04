import {useRef} from 'react';

export function LetterSpacingField({value, onChange}) {
    const isNormal = !value || value === 'normal' || value === '';
    const lastPxRef = useRef(0);
    const parsedPx = (() => {
        if (isNormal) return null;
        const m = String(value).match(/-?\d*\.?\d+/);
        return m ? Number(m[0]) : null;
    })();
    if (parsedPx !== null) lastPxRef.current = parsedPx;

    return (
        <div className="letterspacing-field">
            <div className="segmented" style={{gridTemplateColumns: '1fr 1fr'}}>
                <button
                    type="button"
                    className={`segmented-item${isNormal ? ' active' : ''}`}
                    onClick={() => onChange('normal')}
                >
                    <span>Normal</span>
                </button>
                <button
                    type="button"
                    className={`segmented-item${!isNormal ? ' active' : ''}`}
                    onClick={() => onChange(`${lastPxRef.current}px`)}
                >
                    <span>Custom</span>
                </button>
            </div>
            {!isNormal && (
                <label className="letterspacing-field-input">
                    <input
                        type="number"
                        step="0.1"
                        value={parsedPx ?? 0}
                        onChange={(e) => {
                            const n = e.target.value === '' ? 0 : Number(e.target.value);
                            lastPxRef.current = n;
                            onChange(`${n}px`);
                        }}
                    />
                    <span className="letterspacing-field-suffix">px</span>
                </label>
            )}
        </div>
    );
}
