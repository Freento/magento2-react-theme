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
import {CategoryField} from './CategoryField.jsx';
import {ProductsField} from './ProductsField.jsx';
import {ProductsCountField} from './ProductsCountField.jsx';
import {SliderField} from './SliderField.jsx';
import {PresetNumberField} from './PresetNumberField.jsx';
import {BackgroundField} from './BackgroundField.jsx';
import {CustomCssField} from './CustomCssField.jsx';
import {LinkField} from './LinkField.jsx';
import {findUnsafeHtml} from 'editor-core/lib/safeHtml';
import {
    fieldInput, fieldCheckbox, fieldCheckboxLabel, fieldCheckboxInlineNumber, fieldCheckboxInlineSuffix,
    segInlineNumber, segInlineSuffix,
    dimensionsField, dimensionsCell, dimensionsInput, dimensionsPrefix,
} from '../lib/cls.js';

export function PropFieldInput({
                                   propKey,
                                   schema,
                                   val,
                                   device,
                                   selectedBlock,
                                   selectedRegistry,
                                   updateBlockProp,
                                   updateBlockStyle,
                                   listDrag,
                                   setListDrag,
                                   openAccordion,
                                   setOpenAccordion,
                                   onAddItem,
                                   badge
                               }) {
    const key = propKey;
    return (
        <Fragment>
            {schema.type === 'text' && (
                <input className={fieldInput} type="text" value={val}
                       placeholder={schema.placeholder}
                       onChange={(e) => updateBlockProp(selectedBlock.id, key, e.target.value)}/>
            )}
            {schema.type === 'text' && schema.warnIfEmpty && !String(val).trim() && (
                <div className="field-warning flex gap-1.5 mt-1.5 text-[11.5px] leading-[1.4] text-[#8A5300]">
                    <UI.Info size={13} strokeWidth={2} className="shrink-0 mt-px"/>
                    <span>{schema.warnIfEmpty}</span>
                </div>
            )}
            {schema.type === 'link' && (
                <LinkField className={fieldInput} value={val} placeholder={schema.placeholder}
                           onChange={(v) => updateBlockProp(selectedBlock.id, key, v)}/>
            )}
            {schema.type === 'textarea' && (
                <textarea className={`${fieldInput} h-auto min-h-16 py-[7px] resize-y leading-base`} value={val} rows={3}
                          placeholder={schema.placeholder}
                          onChange={(e) => updateBlockProp(selectedBlock.id, key, e.target.value)}/>
            )}
            {schema.type === 'htmlCode' && (() => {
                const unsafe = findUnsafeHtml(val);
                return (
                    <>
                        <textarea className={`${fieldInput} h-auto min-h-16 py-[7px] resize-y leading-base font-mono text-[12px]`} value={val} rows={6}
                                  spellCheck={false}
                                  onChange={(e) => updateBlockProp(selectedBlock.id, key, e.target.value)}/>
                        {unsafe.length > 0 && (
                            <div className="mt-1.5 text-[11.5px] leading-[1.4] text-ed-danger" role="alert">
                                Scripts are not allowed and won't appear on the page: {unsafe.join(', ')}
                            </div>
                        )}
                    </>
                );
            })()}
            {schema.type === 'customCss' && (
                <CustomCssField value={val} onApply={(v) => updateBlockProp(selectedBlock.id, key, v)}/>
            )}
            {schema.type === 'background' && (
                <BackgroundField
                    color={selectedBlock.style?.backgroundColor || ''}
                    image={schema.inStyle ? selectedBlock.style?.[key] || '' : val}
                    onColor={(v) => updateBlockStyle(selectedBlock.id, 'backgroundColor', v)}
                    onImage={(v) => (schema.inStyle ? updateBlockStyle(selectedBlock.id, key, v) : updateBlockProp(selectedBlock.id, key, v))}
                />
            )}
            {schema.type === 'presetNumber' && (
                <PresetNumberField
                    value={val}
                    presets={schema.presets}
                    min={schema.min}
                    max={schema.max}
                    onChange={(v) => updateBlockProp(selectedBlock.id, key, v)}
                />
            )}
            {schema.type === 'number' && (
                <input className={fieldInput} type="number" value={val || 0}
                       placeholder={schema.placeholder}
                       onChange={(e) => updateBlockProp(selectedBlock.id, key, Number(e.target.value))}/>
            )}
            {schema.type === 'slider' && (
                <SliderField
                    value={val}
                    min={schema.min}
                    max={schema.max}
                    step={schema.step}
                    suffix={schema.suffix}
                    onChange={(v) => updateBlockProp(selectedBlock.id, key, v)}
                />
            )}
            {schema.type === 'boolean' && (
                <div className={fieldCheckbox}>
                    <span className={fieldCheckboxLabel}>{schema.label}</span>
                    {badge}
                    {schema.inlineNumber && (
                        <input
                            type="number"
                            className={fieldCheckboxInlineNumber}
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
                        <span className={fieldCheckboxInlineSuffix}>{schema.inlineNumber.suffix}</span>
                    )}
                    <input type="checkbox" checked={!!val}
                           onChange={(e) => updateBlockProp(selectedBlock.id, key, e.target.checked)}/>
                </div>
            )}
            {schema.type === 'color' && (
                <ColorField value={val} fallback={typeof schema.fallback === 'function' ? schema.fallback({...selectedRegistry.defaultProps, ...selectedBlock.props}) : schema.fallback} onChange={(v) => updateBlockProp(selectedBlock.id, key, v)}/>
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
                    <div className="segmented-with-number flex items-center gap-1.5 [&>.segmented]:flex-1 [&>.segmented]:min-w-0">
                        <Segmented value={val} options={schema.options} onChange={handleChange}/>
                        <input
                            type="number"
                            className={segInlineNumber}
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
                            <span className={segInlineSuffix}>{schema.inlineNumber.suffix}</span>
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
                <select className={fieldInput} value={val}
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
                    <div className="font-family-with-number flex items-center gap-1.5 [&>.fw-field]:flex-1 [&>.fw-field]:min-w-0">
                        {familyField}
                        <input
                            type="number"
                            className={segInlineNumber}
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
                            <span className={segInlineSuffix}>{schema.inlineNumber.suffix}</span>
                        )}
                    </div>
                );
            })()}
            {schema.type === 'dimensions' && (
                <div className={dimensionsField}>
                    {schema.keys.map((dimKey) => (
                        <label key={dimKey} className={dimensionsCell}>
                              <span className={dimensionsPrefix}>
                                {dimKey === 'width' ? 'W' : 'H'}
                              </span>
                            <input
                                className={dimensionsInput}
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
                <div className="number-pair-field grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-1.5">
                    {schema.keys.map((p) => {
                        const Ico = p.icon && UI[p.icon];
                        return (
                            <label
                                key={p.prop}
                                className="number-pair-field-cell flex items-center gap-1 min-w-0 bg-ed-surface border border-solid border-ed-border rounded pl-2 pr-1.5 h-7 [transition:border-color_0.1s] hover:border-ed-border-strong focus-within:border-ed-primary focus-within:shadow-[0_0_0_2px_rgba(15,76,92,0.18)]"
                                data-tooltip={p.title} aria-label={p.title}
                            >
                                {Ico && (
                                    <span className="number-pair-field-icon flex-none inline-flex text-ed-text-soft">
                                    <Ico size={12} strokeWidth={1.75}/>
                                  </span>
                                )}
                                <input
                                    className="ed-no-spin flex-1 min-w-0 h-full border-none outline-none bg-transparent [font-family:inherit] text-[12px] text-ed-text text-right p-0"
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
            {schema.type === 'category' && (
                <CategoryField value={val} onChange={(v) => updateBlockProp(selectedBlock.id, key, v)}/>
            )}
            {schema.type === 'productsCount' && (
                <ProductsCountField
                    value={val}
                    categoryId={selectedBlock.props.categoryId ?? selectedRegistry.defaultProps.categoryId}
                    onChange={(v) => updateBlockProp(selectedBlock.id, key, v)}
                />
            )}
            {schema.type === 'list' && (() => {
                // A list whose items are products (previewBySku) shows the resolved
                // product name in each row instead of the raw SKU.
                const ListComponent = schema.previewBySku ? ProductsField : ListEditorField;
                return (
                    <ListComponent
                        propKey={key}
                        schema={schema}
                        device={device}
                        selectedBlock={selectedBlock}
                        updateBlockProp={updateBlockProp}
                        listDrag={listDrag}
                        setListDrag={setListDrag}
                        openAccordion={openAccordion}
                        setOpenAccordion={setOpenAccordion}
                        getItemPreview={schema.itemPreview}
                        onAddItem={onAddItem}
                    />
                );
            })()}
        </Fragment>
    );
}
