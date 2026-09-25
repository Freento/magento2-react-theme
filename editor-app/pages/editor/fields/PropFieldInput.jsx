import {Fragment} from 'react';
import {UI} from '../../../src/editor/Icon.jsx';
import {ColorField} from './ColorField.jsx';
import {ImageField} from './ImageField.jsx';
import {Segmented} from './Segmented.jsx';
import {SpacingField} from './SpacingField.jsx';
import {LetterSpacingField} from './LetterSpacingField.jsx';
import {FontWeightField} from './FontWeightField.jsx';
import {FontFamilyField} from './FontFamilyField.jsx';
import {ListEditorField} from './ListEditorField.jsx';

export function PropFieldInput({
                                   propKey,
                                   schema,
                                   val,
                                   selectedBlock,
                                   selectedRegistry,
                                   updateBlockProp,
                                   listDrag,
                                   setListDrag,
                                   openAccordion,
                                   setOpenAccordion
                               }) {
    const key = propKey;
    return (
        <Fragment>
            {schema.type === 'text' && (
                <input className="field-input" type="text" value={val}
                       placeholder={schema.placeholder}
                       onChange={(e) => updateBlockProp(selectedBlock.id, key, e.target.value)}/>
            )}
            {schema.type === 'textarea' && (
                <textarea className="field-input" value={val} rows={3}
                          placeholder={schema.placeholder}
                          onChange={(e) => updateBlockProp(selectedBlock.id, key, e.target.value)}/>
            )}
            {schema.type === 'number' && (
                <input className="field-input" type="number" value={val || 0}
                       placeholder={schema.placeholder}
                       onChange={(e) => updateBlockProp(selectedBlock.id, key, Number(e.target.value))}/>
            )}
            {schema.type === 'slider' && (
                <div className="flex items-center gap-2.5">
                    <input
                        type="range"
                        className="flex-1 appearance-none h-1 rounded-full bg-e-border outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[14px] [&::-webkit-slider-thumb]:h-[14px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-e-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-solid [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:[box-shadow:0_1px_3px_rgba(0,0,0,0.18)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:[transition:transform_0.1s] [&::-webkit-slider-thumb:hover]:scale-[1.15] [&::-moz-range-thumb]:w-[14px] [&::-moz-range-thumb]:h-[14px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-e-primary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-solid [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:[box-shadow:0_1px_3px_rgba(0,0,0,0.18)] [&::-moz-range-thumb]:cursor-pointer"
                        min={schema.min ?? 0}
                        max={schema.max ?? 1}
                        step={schema.step ?? 0.01}
                        value={Number(val) || 0}
                        onChange={(e) => updateBlockProp(selectedBlock.id, key, Number(e.target.value))}
                    />
                    <span className="min-w-[32px] text-right text-[12px] font-['SF_Mono',ui-monospace,Menlo,monospace] text-e-text-muted shrink-0">
                            {Number(val || 0).toFixed(2)}
                          </span>
                </div>
            )}
            {schema.type === 'boolean' && (
                <div className="field-checkbox">
                    <span>{schema.label}</span>
                    {schema.inlineNumber && (
                        <input
                            type="number"
                            className="field-input field-checkbox-inline-number"
                            style={{width: schema.inlineNumber.width || 80}}
                            value={selectedBlock.props[schema.inlineNumber.key] ?? selectedRegistry.defaultProps[schema.inlineNumber.key] ?? ''}
                            placeholder={schema.inlineNumber.placeholder}
                            disabled={!val}
                            onChange={(e) => updateBlockProp(
                                selectedBlock.id,
                                schema.inlineNumber.key,
                                e.target.value === '' ? '' : Number(e.target.value)
                            )}
                            onClick={(e) => e.stopPropagation()}
                        />
                    )}
                    {schema.inlineNumber?.suffix && (
                        <span className="field-checkbox-inline-suffix">{schema.inlineNumber.suffix}</span>
                    )}
                    <input type="checkbox" checked={!!val}
                           onChange={(e) => updateBlockProp(selectedBlock.id, key, e.target.checked)}/>
                </div>
            )}
            {schema.type === 'color' && (
                <ColorField value={val} onChange={(v) => updateBlockProp(selectedBlock.id, key, v)}/>
            )}
            {schema.type === 'image' && (
                <ImageField value={val} onChange={(v) => updateBlockProp(selectedBlock.id, key, v)}/>
            )}
            {schema.type === 'segmented' && (() => {
                const handleChange = (v) => {
                    updateBlockProp(selectedBlock.id, key, v);
                    if (Array.isArray(schema.resetOnChange)) {
                        for (const k of schema.resetOnChange) {
                            updateBlockProp(selectedBlock.id, k, '');
                        }
                    }
                };
                if (!schema.inlineNumber) {
                    return (
                        <Segmented
                            value={val}
                            options={schema.options}
                            onChange={handleChange}
                            cols={schema.cols}
                        />
                    );
                }
                const numKey = schema.inlineNumber.key;
                const numDisabled = !val || val === 'none';
                return (
                    <div className="flex items-center gap-1.5 [&_.segmented]:flex-1 [&_.segmented]:min-w-0">
                        <Segmented value={val} options={schema.options} onChange={handleChange}/>
                        <input
                            type="number"
                            className="field-input seg-inline-number"
                            style={{width: schema.inlineNumber.width || 56}}
                            placeholder={schema.inlineNumber.placeholder}
                            value={selectedBlock.props[numKey] ?? ''}
                            disabled={numDisabled}
                            onChange={(e) =>
                                updateBlockProp(
                                    selectedBlock.id,
                                    numKey,
                                    e.target.value === '' ? '' : Number(e.target.value)
                                )
                            }
                        />
                        {schema.inlineNumber.suffix && (
                            <span className="seg-inline-suffix">{schema.inlineNumber.suffix}</span>
                        )}
                    </div>
                );
            })()}
            {schema.type === 'spacing' && (
                <SpacingField
                    value={val}
                    onChange={(v) => updateBlockProp(selectedBlock.id, key, v)}
                    variant={key.includes('margin') ? 'margin' : 'padding'}
                />
            )}
            {schema.type === 'select' && (
                <select className="field-input" value={val}
                        onChange={(e) => updateBlockProp(selectedBlock.id, key, e.target.value)}>
                    {schema.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            )}
            {schema.type === 'letterSpacing' && (
                <LetterSpacingField
                    value={val}
                    onChange={(v) => updateBlockProp(selectedBlock.id, key, v)}
                />
            )}
            {schema.type === 'fontWeight' && (
                <FontWeightField
                    value={val}
                    onChange={(v) => updateBlockProp(selectedBlock.id, key, v)}
                />
            )}
            {schema.type === 'fontFamily' && (() => {
                const familyField = (
                    <FontFamilyField
                        value={val}
                        onChange={(v) => updateBlockProp(selectedBlock.id, key, v)}
                    />
                );
                if (!schema.inlineNumber) return familyField;
                const numKey = schema.inlineNumber.key;
                const raw = selectedBlock.props[numKey];
                const numForInput =
                    typeof raw === 'string' ? (parseFloat(raw) || '') : (raw ?? '');
                return (
                    <div className="flex items-center gap-1.5 [&_.fw-field]:flex-1 [&_.fw-field]:min-w-0">
                        {familyField}
                        <input
                            type="number"
                            className="field-input seg-inline-number"
                            style={{width: schema.inlineNumber.width || 64}}
                            placeholder={schema.inlineNumber.placeholder}
                            value={numForInput}
                            onChange={(e) =>
                                updateBlockProp(
                                    selectedBlock.id,
                                    numKey,
                                    e.target.value === '' ? '' : Number(e.target.value)
                                )
                            }
                        />
                        {schema.inlineNumber.suffix && (
                            <span className="seg-inline-suffix">{schema.inlineNumber.suffix}</span>
                        )}
                    </div>
                );
            })()}
            {schema.type === 'dimensions' && (
                <div className="grid grid-cols-2 gap-2 min-w-0">
                    {schema.keys.map((dimKey) => (
                        <label key={dimKey}
                               className="flex items-center gap-1.5 px-2 h-[30px] min-w-0 border border-transparent rounded-e bg-e-surface-alt transition-[background-color,border-color,box-shadow] duration-100 cursor-text hover:bg-e-surface hover:border-e-border-strong focus-within:bg-e-surface focus-within:border-e-primary focus-within:shadow-[0_0_0_2px_rgba(37,99,235,0.18)]">
                              <span className="text-[11px] font-medium text-e-text-soft uppercase shrink-0 leading-none">
                                {dimKey === 'width' ? 'W' : 'H'}
                              </span>
                            <input
                                type="text"
                                className="flex-1 min-w-0 border-0 outline-none bg-transparent [font-family:inherit] text-[12px] text-e-text p-0"
                                placeholder={schema.placeholders?.[dimKey] || 'auto'}
                                value={selectedBlock.props[dimKey] ?? ''}
                                onChange={(e) =>
                                    updateBlockProp(selectedBlock.id, dimKey, e.target.value)
                                }
                            />
                        </label>
                    ))}
                </div>
            )}
            {schema.type === 'numberPair' && (
                <div className="grid grid-cols-2 gap-1.5">
                    {schema.keys.map((p) => {
                        const Ico = p.icon && UI[p.icon];
                        return (
                            <label
                                key={p.prop}
                                className="flex items-center gap-1 min-w-0 bg-e-surface border border-e-border rounded-e pl-2 pr-1.5 h-7 transition-colors duration-100 hover:border-e-border-strong focus-within:border-e-primary focus-within:shadow-[0_0_0_2px_rgba(59,130,246,0.18)]"
                                data-tooltip={p.title}
                            >
                                {Ico && (
                                    <span className="shrink-0 inline-flex text-e-text-soft">
                                    <Ico size={12} strokeWidth={1.75}/>
                                  </span>
                                )}
                                <input
                                    type="number"
                                    className="flex-1 min-w-0 h-full border-none outline-none bg-transparent [font-family:inherit] text-[12px] text-e-text text-right p-0 [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:[-webkit-appearance:none] [&::-webkit-inner-spin-button]:[-webkit-appearance:none]"
                                    value={selectedBlock.props[p.prop] ?? ''}
                                    placeholder={p.placeholder}
                                    onChange={(e) =>
                                        updateBlockProp(
                                            selectedBlock.id,
                                            p.prop,
                                            e.target.value === '' ? '' : Number(e.target.value)
                                        )
                                    }
                                />
                            </label>
                        );
                    })}
                </div>
            )}
            {schema.type === 'list' && (
                <ListEditorField
                    propKey={key}
                    schema={schema}
                    selectedBlock={selectedBlock}
                    updateBlockProp={updateBlockProp}
                    listDrag={listDrag}
                    setListDrag={setListDrag}
                    openAccordion={openAccordion}
                    setOpenAccordion={setOpenAccordion}
                />
            )}
        </Fragment>
    );
}
