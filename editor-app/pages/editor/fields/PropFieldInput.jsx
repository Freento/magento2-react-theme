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
                <div className="slider-field">
                    <input
                        type="range"
                        min={schema.min ?? 0}
                        max={schema.max ?? 1}
                        step={schema.step ?? 0.01}
                        value={Number(val) || 0}
                        onChange={(e) => updateBlockProp(selectedBlock.id, key, Number(e.target.value))}
                    />
                    <span className="slider-field-value">
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
                    <div className="segmented-with-number">
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
                    <div className="font-family-with-number">
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
                <div className="dimensions-field">
                    {schema.keys.map((dimKey) => (
                        <label key={dimKey} className="dimensions-field-cell">
                              <span className="dimensions-field-prefix">
                                {dimKey === 'width' ? 'W' : 'H'}
                              </span>
                            <input
                                type="text"
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
                <div className="number-pair-field">
                    {schema.keys.map((p) => {
                        const Ico = p.icon && UI[p.icon];
                        return (
                            <label
                                key={p.prop}
                                className="number-pair-field-cell"
                                data-tooltip={p.title}
                            >
                                {Ico && (
                                    <span className="number-pair-field-icon">
                                    <Ico size={12} strokeWidth={1.75}/>
                                  </span>
                                )}
                                <input
                                    type="number"
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
