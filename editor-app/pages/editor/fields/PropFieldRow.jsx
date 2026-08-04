import {Fragment} from 'react';
import {UI} from '../../../src/editor/Icon.jsx';


import { PropFieldInput } from './PropFieldInput.jsx';

export function PropFieldRow({
                                 it,
                                 selectedBlock,
                                 selectedRegistry,
                                 device,
                                 hasOverride,
                                 resetOverride,
                                 updateBlockProp,
                                 listDrag,
                                 setListDrag,
                                 openAccordion,
                                 setOpenAccordion,
                             }) {
    const key = it.key;
    const schema = it.schema;
    const val = selectedBlock.props[key] ?? selectedRegistry.defaultProps[key] ?? '';
    return (
        <Fragment key={`p-${key}`}>
            <div className="field">
                {schema.type !== 'boolean' && (
                    <div className="field-head">
                        <label className="field-label">{schema.label}</label>
                        {device !== 'desktop' && hasOverride('props', key) && (
                            <button
                                type="button"
                                className="field-override-reset"
                                title={`Reset value for ${device === 'mobile' ? 'mobile' : 'tablet'}`}
                                onClick={() => resetOverride('props', key)}
                            >
                                <UI.Reset size={12} strokeWidth={2}/>
                            </button>
                        )}
                        {schema.type === 'list' && (
                            <button
                                type="button"
                                className="btn-add-item"
                                onClick={() => {
                                    const newItem = {};
                                    Object.keys(schema.itemSchema).forEach((f) => {
                                        newItem[f] = '';
                                    });
                                    const arr = [...(selectedBlock.props[key] || []), newItem];
                                    updateBlockProp(selectedBlock.id, key, arr);
                                    setOpenAccordion(`${key}-${arr.length - 1}`);
                                }}
                                data-tooltip="Add"
                                aria-label="Add"
                            >
                                <UI.Plus size={14} strokeWidth={2}/>
                            </button>
                        )}
                    </div>
                )}
                <PropFieldInput
                    propKey={key}
                    schema={schema}
                    val={val}
                    selectedBlock={selectedBlock}
                    selectedRegistry={selectedRegistry}
                    updateBlockProp={updateBlockProp}
                    listDrag={listDrag}
                    setListDrag={setListDrag}
                    openAccordion={openAccordion}
                    setOpenAccordion={setOpenAccordion}
                />
            </div>
        </Fragment>
    );
}
