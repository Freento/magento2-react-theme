import {Fragment} from 'react';
import {UI} from '../../../src/editor/Icon.jsx';


import { PropFieldInput } from './PropFieldInput.jsx';
import { DeviceOverrideBadge, overrideKeysOf, isOverridden, resetKeys } from './DeviceOverrideBadge.jsx';
import { fieldHead, fieldLabel } from '../lib/cls.js';

export function PropFieldRow({
                                 it,
                                 selectedBlock,
                                 selectedRegistry,
                                 device,
                                 hasOverride,
                                 resetOverride,
                                 updateBlockProp,
                                 updateBlockStyle,
                                 listDrag,
                                 setListDrag,
                                 openAccordion,
                                 setOpenAccordion,
                             }) {
    const key = it.key;
    const schema = it.schema;
    const val = selectedBlock.props[key] ?? selectedRegistry.defaultProps[key] ?? '';
    const addItem = () => {
        const newItem = {};
        Object.entries(schema.itemSchema || {}).forEach(([f, def]) => {
            // A field can seed a new row (e.g. the type a
            // `showIf` keys off, which must not start blank).
            if (def && def.default !== undefined) newItem[f] = def.default;
            else if (def && (def.type === 'list' || def.type === 'multiSelect')) newItem[f] = [];
            else newItem[f] = '';
        });
        const arr = [...(selectedBlock.props[key] || []), newItem];
        updateBlockProp(selectedBlock.id, key, arr);
        setOpenAccordion(`${key}-${arr.length - 1}`);
    };
    const keys = overrideKeysOf({source: 'prop', key, schema});
    const badge = schema.type === 'customCss' || schema.perScreen === false ? null : (
        <DeviceOverrideBadge
            device={device}
            overridden={isOverridden(keys, hasOverride)}
            onReset={() => resetKeys(keys, resetOverride)}
        />
    );
    return (
        <Fragment key={`p-${key}`}>
            <div className="field">
                {schema.type !== 'boolean' && (
                    // List fields (e.g. Menu Items) get a bit more breathing room under the label.
                    <div className={`${fieldHead}${schema.type === 'list' ? ' mb-2.5' : ' mb-[5px]'}`}>
                        <label className={`${fieldLabel} flex-1`}>{schema.label}</label>
                        {badge}
                        {schema.type === 'list' && (
                            <button
                                type="button"
                                className="btn-add-item w-5 h-5 p-0 ml-auto bg-transparent border-none rounded cursor-pointer text-ed-text-muted inline-flex items-center justify-center [transition:background-color_0.1s,color_0.1s] hover:bg-ed-bg hover:text-ed-primary"
                                onClick={(e) => {
                                    if (schema.previewBySku) {
                                        window.dispatchEvent(new CustomEvent('editor:product-search', {detail: {key, anchor: e.currentTarget}}));
                                        return;
                                    }
                                    addItem();
                                }}
                                data-tooltip={schema.previewBySku ? 'Add products' : 'Add'}
                                aria-label={schema.previewBySku ? 'Add products' : 'Add'}
                            >
                                <UI.Plus size={14} strokeWidth={2}/>
                            </button>
                        )}
                    </div>
                )}
                <PropFieldInput
                    badge={badge}
                    propKey={key}
                    schema={schema}
                    val={val}
                    device={device}
                    selectedBlock={selectedBlock}
                    selectedRegistry={selectedRegistry}
                    updateBlockProp={updateBlockProp}
                    updateBlockStyle={updateBlockStyle}
                    listDrag={listDrag}
                    setListDrag={setListDrag}
                    openAccordion={openAccordion}
                    setOpenAccordion={setOpenAccordion}
                    onAddItem={addItem}
                />
            </div>
        </Fragment>
    );
}
