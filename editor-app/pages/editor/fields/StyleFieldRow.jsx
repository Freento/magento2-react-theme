import {Fragment} from 'react';
import {UI} from '../../../src/editor/Icon.jsx';
import {ColorField} from './ColorField.jsx';
import {CornerRadiusField} from './CornerRadiusField.jsx';
import {FontFamilyField} from './FontFamilyField.jsx';
import {ImageField} from './ImageField.jsx';
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
            <div className="field mb-0">
                {s.type !== 'boolean' && (
                    <div className="field-head flex items-center gap-1.5 mb-[5px]">
                        <label className="field-label block text-[11.5px] font-normal text-e-text-muted m-0 flex-1">{s.label}</label>
                        {device !== 'desktop' && hasOverride('style', s.key) && (
                            <button
                                type="button"
                                className="field-override-reset inline-flex items-center justify-center w-[18px] h-[18px] border border-e-primary-border bg-e-primary-soft text-e-primary rounded-e cursor-pointer p-0 transition-all duration-100 hover:bg-e-primary hover:text-white hover:border-e-primary"
                                title={`Reset value for ${device === 'mobile' ? 'mobile' : 'tablet'}`}
                                onClick={() => resetOverride('style', s.key)}
                            >
                                <UI.Reset size={12} strokeWidth={2}/>
                            </button>
                        )}
                    </div>
                )}
                {s.type === 'dimensions' ? (
                    <div className="grid grid-cols-2 gap-2 min-w-0">
                        {s.keys.map((dimKey, i) => (
                            <label key={dimKey}
                                   className="flex items-center gap-1.5 px-2 h-[30px] min-w-0 border border-transparent rounded-e bg-e-surface-alt transition-[background-color,border-color,box-shadow] duration-100 cursor-text hover:bg-e-surface hover:border-e-border-strong focus-within:bg-e-surface focus-within:border-e-primary focus-within:shadow-[0_0_0_2px_rgba(37,99,235,0.18)]">
                                <span className="text-[11px] font-medium text-e-text-soft uppercase shrink-0 leading-none">{dimKey === 'width' ? 'W' : 'H'}</span>
                                <input
                                    type="text"
                                    className="flex-1 min-w-0 border-0 outline-none bg-transparent [font-family:inherit] text-[12px] text-e-text p-0"
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
                ) : s.type === 'image' ? (
                    <ImageField value={selectedBlock.style?.[s.key]}
                                onChange={(v) => updateBlockStyle(selectedBlock.id, s.key, v)}/>
                ) : s.type === 'slider' ? (
                    <div className="flex items-center gap-2.5">
                        <input
                            type="range"
                            className="flex-1 appearance-none h-1 rounded-full bg-e-border outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[14px] [&::-webkit-slider-thumb]:h-[14px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-e-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-solid [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:[box-shadow:0_1px_3px_rgba(0,0,0,0.18)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:[transition:transform_0.1s] [&::-webkit-slider-thumb:hover]:scale-[1.15] [&::-moz-range-thumb]:w-[14px] [&::-moz-range-thumb]:h-[14px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-e-primary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-solid [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:[box-shadow:0_1px_3px_rgba(0,0,0,0.18)] [&::-moz-range-thumb]:cursor-pointer"
                            min={s.min ?? 0}
                            max={s.max ?? 1}
                            step={s.step ?? 0.01}
                            value={Number(selectedBlock.style?.[s.key]) || 0}
                            onChange={(e) => updateBlockStyle(selectedBlock.id, s.key, Number(e.target.value))}
                        />
                        <span className="min-w-[32px] text-right text-[12px] font-['SF_Mono',ui-monospace,Menlo,monospace] text-e-text-muted shrink-0">
                            {(Number(selectedBlock.style?.[s.key]) || 0).toFixed(2)}
                        </span>
                    </div>
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
                            <div className="flex items-center gap-1.5 [&_.fw-field]:flex-1 [&_.fw-field]:min-w-0">
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
                                <div className="flex items-center gap-1.5 [&_.segmented]:flex-1 [&_.segmented]:min-w-0">
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
