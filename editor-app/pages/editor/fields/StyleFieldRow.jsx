import {Fragment} from 'react';
import {UI} from '../../../src/editor/Icon.jsx';
import {ColorField} from './ColorField.jsx';
import {CornerRadiusField} from './CornerRadiusField.jsx';
import {FontFamilyField} from './FontFamilyField.jsx';
import {Segmented} from './Segmented.jsx';
import {SpacingField} from './SpacingField.jsx';

export function StyleFieldRow({
                                  s,
                                  selectedBlock,
                                  device,
                                  hasOverride,
                                  resetOverride,
                                  updateBlockStyle,
                                  patchBlockStyle,
                              }) {
    return (
        <Fragment key={`s-${s.key}`}>
            <div className="field">
                {s.type !== 'boolean' && (
                    <div className="field-head">
                        <label className="field-label">{s.label}</label>
                        {device !== 'desktop' && hasOverride('style', s.key) && (
                            <button
                                type="button"
                                className="field-override-reset"
                                title={`Reset value for ${device === 'mobile' ? 'mobile' : 'tablet'}`}
                                onClick={() => resetOverride('style', s.key)}
                            >
                                <UI.Reset size={12} strokeWidth={2}/>
                            </button>
                        )}
                    </div>
                )}
                {s.type === 'dimensions' ? (
                    <div className="dimensions-field">
                        {s.keys.map((dimKey, i) => (
                            <label key={dimKey} className="dimensions-field-cell">
                                <span className="dimensions-field-prefix">{dimKey === 'width' ? 'W' : 'H'}</span>
                                <input
                                    type="text"
                                    placeholder="auto"
                                    value={selectedBlock.style?.[dimKey] || ''}
                                    onChange={(e) => updateBlockStyle(selectedBlock.id, dimKey, e.target.value)}
                                />
                            </label>
                        ))}
                    </div>
                ) : s.type === 'color' ? (
                    <ColorField value={selectedBlock.style?.[s.key]}
                                onChange={(v) => updateBlockStyle(selectedBlock.id, s.key, v)}/>
                ) : s.type === 'cornerRadius' ? (
                    <CornerRadiusField
                        value={selectedBlock.style?.[s.key]}
                        onChange={(v) => updateBlockStyle(selectedBlock.id, s.key, v)}
                    />
                ) : s.type === 'fontFamily' ? (
                    (() => {
                        const familyField = (
                            <FontFamilyField
                                value={selectedBlock.style?.[s.key] || 'inherit'}
                                onChange={(v) => updateBlockStyle(selectedBlock.id, s.key, v)}
                            />
                        );
                        if (!s.inlineNumber) return familyField;
                        const numKey = s.inlineNumber.key;
                        const raw = selectedBlock.style?.[numKey];
                        const numForInput =
                            typeof raw === 'string' ? (parseFloat(raw) || '') : (raw ?? '');
                        return (
                            <div className="font-family-with-number">
                                {familyField}
                                <input
                                    type="number"
                                    className="field-input seg-inline-number"
                                    style={{width: s.inlineNumber.width || 64}}
                                    placeholder={s.inlineNumber.placeholder}
                                    value={numForInput}
                                    onChange={(e) =>
                                        updateBlockStyle(
                                            selectedBlock.id,
                                            numKey,
                                            e.target.value === '' ? '' : Number(e.target.value)
                                        )
                                    }
                                />
                                {s.inlineNumber.suffix && (
                                    <span className="seg-inline-suffix">{s.inlineNumber.suffix}</span>
                                )}
                            </div>
                        );
                    })()
                ) : s.type === 'segmented' ? (
                    s.inlineNumber ? (
                        (() => {
                            const styleVal = selectedBlock.style?.[s.key] || '';
                            const numKey = s.inlineNumber.key;
                            const numDisabled = !styleVal || styleVal === 'none';
                            return (
                                <div className="segmented-with-number">
                                    <Segmented
                                        value={styleVal}
                                        options={s.options}
                                        onChange={(v) => updateBlockStyle(selectedBlock.id, s.key, v)}
                                    />
                                    <input
                                        type="number"
                                        className="field-input seg-inline-number"
                                        style={{width: s.inlineNumber.width || 56}}
                                        placeholder={s.inlineNumber.placeholder}
                                        value={selectedBlock.style?.[numKey] ?? ''}
                                        disabled={numDisabled}
                                        onChange={(e) =>
                                            updateBlockStyle(
                                                selectedBlock.id,
                                                numKey,
                                                e.target.value === '' ? '' : Number(e.target.value)
                                            )
                                        }
                                    />
                                    {s.inlineNumber.suffix && (
                                        <span className="seg-inline-suffix">{s.inlineNumber.suffix}</span>
                                    )}
                                </div>
                            );
                        })()
                    ) : (
                        <Segmented
                            value={selectedBlock.style?.[s.key] || ''}
                            options={s.options}
                            onChange={(v) => updateBlockStyle(selectedBlock.id, s.key, v)}
                            cols={s.cols}
                        />
                    )
                ) : s.type === 'select' ? (
                    <select className="field-input" value={selectedBlock.style?.[s.key] || ''}
                            onChange={(e) => updateBlockStyle(selectedBlock.id, s.key, e.target.value)}>
                        <option value="">—</option>
                        {s.options.map((opt) => {
                            const o = typeof opt === 'string' ? {value: opt, label: opt} : opt;
                            return <option key={o.value} value={o.value}>{o.label}</option>;
                        })}
                    </select>
                ) : s.type === 'boolean' ? (
                    <div className="field-checkbox">
                        <input
                            type="checkbox"
                            checked={!!selectedBlock.style?.[s.key]}
                            onChange={(e) => updateBlockStyle(selectedBlock.id, s.key, e.target.checked)}
                        />
                        <span>{s.label}</span>
                    </div>
                ) : s.type === 'spacing' ? (
                    <SpacingField
                        style={selectedBlock.style}
                        variant={s.key}
                        onPatch={(patch) => patchBlockStyle(selectedBlock.id, patch)}
                    />
                ) : s.type === 'number' ? (
                    <input
                        className="field-input"
                        type="number"
                        value={selectedBlock.style?.[s.key] ?? ''}
                        placeholder={s.placeholder}
                        onChange={(e) =>
                            updateBlockStyle(
                                selectedBlock.id,
                                s.key,
                                e.target.value === '' ? '' : Number(e.target.value)
                            )
                        }
                    />
                ) : (
                    <input className="field-input" type="text" placeholder={s.placeholder ?? 'auto'}
                           value={selectedBlock.style?.[s.key] || ''}
                           onChange={(e) => updateBlockStyle(selectedBlock.id, s.key, e.target.value)}/>
                )}
            </div>
        </Fragment>
    );
}
