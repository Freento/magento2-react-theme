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
            <div className="field mb-0">
                {schema.type !== 'boolean' && (
                    <div className="field-head flex items-center gap-1.5 mb-[5px]">
                        <label className="field-label block text-[11.5px] font-normal text-e-text-muted m-0 flex-1">{schema.label}</label>
                        {device !== 'desktop' && hasOverride('props', key) && (
                            <button
                                type="button"
                                className="field-override-reset inline-flex items-center justify-center w-[18px] h-[18px] border border-e-primary-border bg-e-primary-soft text-e-primary rounded-e cursor-pointer p-0 transition-all duration-100 hover:bg-e-primary hover:text-white hover:border-e-primary"
                                title={`Reset value for ${device === 'mobile' ? 'mobile' : 'tablet'}`}
                                onClick={() => resetOverride('props', key)}
                            >
                                <UI.Reset size={12} strokeWidth={2}/>
                            </button>
                        )}
                        {schema.type === 'list' && (
                            <button
                                type="button"
                                className="w-5 h-5 p-0 ml-auto bg-transparent border-none rounded-e cursor-pointer text-e-text-muted inline-flex items-center justify-center transition-colors duration-100 hover:bg-e-surface-alt hover:text-e-primary"
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
