import {Fragment} from 'react';
import {ColorField} from './ColorField.jsx';
import {CornerRadiusField} from './CornerRadiusField.jsx';
import {FontFamilyField} from './FontFamilyField.jsx';
import {Segmented} from './Segmented.jsx';
import {SpacingField} from './SpacingField.jsx';
import {ImageField} from './ImageField.jsx';
import {SliderField} from './SliderField.jsx';
import {LinkField} from './LinkField.jsx';
import {DeviceOverrideBadge, overrideKeysOf, isOverridden, resetKeys} from './DeviceOverrideBadge.jsx';
import {
    fieldHead, fieldLabel, fieldInput, fieldCheckbox, fieldCheckboxLabel,
    segInlineNumber, segInlineSuffix, dimensionsField, dimensionsCell, dimensionsInput, dimensionsPrefix,
} from '../lib/cls.js';

export function StyleFieldRow({
                                  s,
                                  selectedBlock,
                                  selectedRegistry,
                                  device,
                                  hasOverride,
                                  resetOverride,
                                  updateBlockStyle,
                                  patchBlockStyle,
                              }) {
    const keys = overrideKeysOf({source: 'style', schema: s});
    const badge = (
        <DeviceOverrideBadge
            device={device}
            overridden={isOverridden(keys, hasOverride)}
            onReset={() => resetKeys(keys, resetOverride)}
        />
    );
    return (
        <Fragment key={`s-${s.key}`}>
            <div className="field">
                {s.type !== 'boolean' && (
                    <div className={`${fieldHead} mb-[5px]`}>
                        <label className={`${fieldLabel} flex-1`}>{s.label}</label>
                        {badge}
                    </div>
                )}
                {s.type === 'dimensions' ? (
                    <div className={dimensionsField}>
                        {s.keys.map((dimKey) => {
                            const raw = selectedBlock.style?.[dimKey];
                            const str = raw === undefined || raw === null ? '' : String(raw);
                            const pxMatch = str.match(/^(-?\d*\.?\d+)px$/);
                            const shown = pxMatch ? pxMatch[1] : str;
                            const isPx = !str || !!pxMatch || /^-?\d*\.?\d+$/.test(str);
                            // Blocks flagged `fullWidthOverridesWidth` drop the width while
                            // stretched to the screen; the stored value is kept for when
                            // they are not.
                            const stretched = dimKey === 'width'
                                && !!selectedRegistry?.fullWidthOverridesWidth
                                && !!selectedBlock.style?.fullWidth;
                            return (
                                <label
                                    key={dimKey}
                                    className={dimensionsCell}
                                    data-tooltip={stretched ? 'Ignored while "Stretch to full screen width" is on' : undefined}
                                >
                                    <span className={dimensionsPrefix}>{dimKey === 'width' ? 'W' : 'H'}</span>
                                    <input
                                        className={dimensionsInput}
                                        type="text"
                                        placeholder={stretched ? 'screen' : 'auto'}
                                        disabled={stretched}
                                        value={shown}
                                        onChange={(e) => {
                                            const v = e.target.value.trim();
                                            updateBlockStyle(selectedBlock.id, dimKey, /^-?\d*\.?\d+$/.test(v) ? `${v}px` : v);
                                        }}
                                    />
                                    {isPx && <span className={dimensionsPrefix}>px</span>}
                                </label>
                            );
                        })}
                    </div>
                ) : s.type === 'color' ? (
                    <ColorField value={selectedBlock.style?.[s.key]}
                                fallback={s.fallback}
                                onChange={(v) => updateBlockStyle(selectedBlock.id, s.key, v)}/>
                ) : s.type === 'image' ? (
                    <ImageField value={selectedBlock.style?.[s.key]}
                                onChange={(v) => updateBlockStyle(selectedBlock.id, s.key, v)}/>
                ) : s.type === 'slider' ? (
                    <SliderField
                        value={selectedBlock.style?.[s.key] ?? s.min ?? 0}
                        min={s.min}
                        max={s.max}
                        step={s.step}
                        suffix={s.suffix}
                        onChange={(v) => updateBlockStyle(selectedBlock.id, s.key, v)}
                    />
                ) : s.type === 'link' ? (
                    <LinkField className={fieldInput} value={selectedBlock.style?.[s.key] || ''} placeholder={s.placeholder}
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
                            <div className="font-family-with-number flex items-center gap-1.5 [&>.fw-field]:flex-1 [&>.fw-field]:min-w-0">
                                {familyField}
                                <input
                                    type="number"
                                    className={segInlineNumber}
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
                                    <span className={segInlineSuffix}>{s.inlineNumber.suffix}</span>
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
                                <div className="segmented-with-number flex items-center gap-1.5 [&>.segmented]:flex-1 [&>.segmented]:min-w-0">
                                    <Segmented
                                        value={styleVal}
                                        options={s.options}
                                        onChange={(v) => updateBlockStyle(selectedBlock.id, s.key, v)}
                                    />
                                    <input
                                        type="number"
                                        className={segInlineNumber}
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
                                        <span className={segInlineSuffix}>{s.inlineNumber.suffix}</span>
                                    )}
                                </div>
                            );
                        })()
                    ) : (
                        <Segmented
                            value={s.getValue ? s.getValue(selectedBlock.style || {}) : selectedBlock.style?.[s.key] || ''}
                            options={s.options}
                            onChange={(v) =>
                                s.toPatch
                                    ? patchBlockStyle(selectedBlock.id, s.toPatch(v, selectedBlock.style || {}))
                                    : updateBlockStyle(selectedBlock.id, s.key, v)
                            }
                            cols={s.cols}
                        />
                    )
                ) : s.type === 'select' ? (
                    <select className={fieldInput} value={selectedBlock.style?.[s.key] || ''}
                            onChange={(e) => updateBlockStyle(selectedBlock.id, s.key, e.target.value)}>
                        <option value="">—</option>
                        {s.options.map((opt) => {
                            const o = typeof opt === 'string' ? {value: opt, label: opt} : opt;
                            return <option key={o.value} value={o.value}>{o.label}</option>;
                        })}
                    </select>
                ) : s.type === 'boolean' ? (
                    <div className={fieldCheckbox}>
                        <span className={fieldCheckboxLabel}>{s.label}</span>
                        {badge}
                        <input
                            type="checkbox"
                            checked={!!selectedBlock.style?.[s.key]}
                            onChange={(e) => updateBlockStyle(selectedBlock.id, s.key, e.target.checked)}
                        />
                    </div>
                ) : s.type === 'spacing' ? (
                    <SpacingField
                        style={selectedBlock.style}
                        variant={s.key}
                        onPatch={(patch) => patchBlockStyle(selectedBlock.id, patch)}
                    />
                ) : s.type === 'number' ? (
                    <input
                        className={fieldInput}
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
                    <input className={fieldInput} type="text" placeholder={s.placeholder ?? 'auto'}
                           value={selectedBlock.style?.[s.key] || ''}
                           onChange={(e) => updateBlockStyle(selectedBlock.id, s.key, e.target.value)}/>
                )}
            </div>
        </Fragment>
    );
}
