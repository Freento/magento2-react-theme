import {useState} from 'react';
import {UI} from '../../../src/editor/Icon.jsx';
import {ImageField} from './ImageField.jsx';
import {ColorField} from './ColorField.jsx';
import {SpacingField} from './SpacingField.jsx';
import {LinkField} from './LinkField.jsx';
import {btnIconDanger, fieldCheckbox, fieldCheckboxLabel} from '../lib/cls.js';

// Normalises both option spellings: a bare string, or {value, label}.
const optionOf = (o) => (typeof o === 'string' ? {value: o, label: o} : o);

// Row shell; `dragOver` paints the insert bar, `open` swaps the accent border.
const listItemCls = (isOpen, dragging) => [
    'ed-list-item group/item relative bg-ed-surface border border-solid rounded [transition:border-color_0.1s]',
    isOpen ? 'open border-ed-primary' : 'border-ed-border',
    dragging ? 'dragging opacity-40' : '',
].filter(Boolean).join(' ');

const dropLine = (side) =>
    'list-drop-line absolute left-0 right-0 h-1 rounded-[2px] bg-ed-primary z-10 ' +
    (side === 'after' ? '-bottom-0.5' : '-top-0.5');

const listItemHeader = (isOpen, nested) =>
    'list-item-header flex justify-between items-center cursor-pointer select-none [transition:background_0.1s] ' +
    (nested ? 'min-h-7 px-2 py-1 ' : 'min-h-8 px-2.5 py-1.5 ') +
    (isOpen
        ? 'rounded-t bg-ed-primary-soft hover:bg-ed-sel-soft'
        : 'rounded bg-ed-bg hover:bg-ed-surface-hover');

const listItemTitle = 'list-item-title flex items-center gap-1.5 min-w-0 flex-1';
const listItemPreview = (nested) =>
    `list-item-preview font-medium text-ed-text truncate ${nested ? 'text-[11.5px]' : 'text-[12px]'}`;
const listItemGrip =
    'list-item-grip inline-flex items-center justify-center text-ed-text-soft shrink-0 cursor-grab ' +
    '[transition:color_0.1s] group-hover/item:text-ed-text-muted';
const listItemActions = 'list-item-actions flex gap-0.5 shrink-0';
const listItemBody = 'list-item-body p-2.5 flex flex-col gap-2.5 border-t border-solid border-ed-border bg-ed-surface rounded-b';

// The same rule the old `.list-item-field > input/textarea/select` applied.
const listItemInput =
    'w-full h-7 px-2 border border-solid border-ed-border rounded text-[12.5px] [font-family:inherit] outline-none ' +
    'bg-ed-surface [transition:border-color_0.1s,box-shadow_0.1s] focus:border-ed-primary focus:shadow-[0_0_0_2px_rgba(15,76,92,0.12)]';

// A field can hide itself based on the row it belongs to (`showIf(item)`), or
// on the device being edited (`mobileOnly`).
const visibleFields = (itemSchema, item, device) =>
    Object.entries(itemSchema).filter(([, def]) => {
        if (!def) return true;
        if (def.mobileOnly && device !== 'mobile') return false;
        if (typeof def.showIf === 'function' && !def.showIf(item || {})) return false;
        return true;
    });

// One input inside a list row. Shared by the top-level list and its nested
// lists so both support the same field types.
function ItemFieldInput({fieldDef, value, onChange, device}) {
    const type = typeof fieldDef === 'object' ? fieldDef.type : 'text';
    switch (type) {
        case 'list':
            return (
                <NestedList
                    items={value || []}
                    itemSchema={fieldDef.itemSchema}
                    onChange={onChange}
                    device={device}
                />
            );
        case 'image':
            return <ImageField value={value || ''} onChange={onChange}/>;
        case 'link':
            return <LinkField className={listItemInput} value={value || ''} placeholder={fieldDef.placeholder} onChange={onChange}/>;
        case 'textarea':
            return <textarea className={listItemInput} value={value || ''} rows={3} onChange={(e) => onChange(e.target.value)}/>;
        case 'number':
            return <input className={listItemInput} type="number" value={value ?? ''} onChange={(e) => onChange(Number(e.target.value))}/>;
        case 'color':
            return <ColorField value={value || ''} onChange={onChange}/>;
        case 'spacing':
            return <SpacingField value={value || ''} onChange={onChange} variant="margin"/>;
        case 'date':
            // Empty stays empty — callers read a blank bound as "open ended".
            return <input className={listItemInput} type="date" value={value || ''} onChange={(e) => onChange(e.target.value)}/>;
        case 'select':
            return (
                <select className={listItemInput} value={value || ''} onChange={(e) => onChange(e.target.value)}>
                    {!value && <option value="">Select…</option>}
                    {(fieldDef.options || []).map(optionOf).map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
            );
        case 'multiSelect': {
            const selected = Array.isArray(value) ? value : [];
            return (
                <div className="list-item-checks flex flex-col gap-1">
                    {(fieldDef.options || []).map(optionOf).map((o) => {
                        const on = selected.includes(o.value);
                        return (
                            <label key={o.value} className="list-item-check flex items-center gap-1.5 text-[12px] text-ed-text cursor-pointer">
                                <input
                                    className="w-[13px] h-[13px] m-0 shrink-0 cursor-pointer"
                                    type="checkbox"
                                    checked={on}
                                    onChange={() => onChange(
                                        on ? selected.filter((v) => v !== o.value) : [...selected, o.value]
                                    )}
                                />
                                <span>{o.label}</span>
                            </label>
                        );
                    })}
                </div>
            );
        }
        default:
            return <input className={listItemInput} type="text" value={value || ''} onChange={(e) => onChange(e.target.value)}/>;
    }
}

function ItemFields({itemSchema, item, device, setField}) {
    return visibleFields(itemSchema, item, device).map(([field, fieldDef]) => (
        <div key={field} className="list-item-field">
            {fieldDef && fieldDef.type === 'boolean' ? (
                <label className={fieldCheckbox}>
                    <span className={fieldCheckboxLabel}>{fieldDef.label}</span>
                    <input type="checkbox" checked={!!item[field]} onChange={(e) => setField(field, e.target.checked)}/>
                </label>
            ) : (
                <>
                    {/* A field that holds a nested list (Submenu / Sub-submenu) reads as a section. */}
                    <label
                        className={
                            fieldDef && fieldDef.type === 'list'
                                ? 'block text-[10px] font-semibold tracking-[0.06em] uppercase text-ed-text-soft mb-1'
                                : 'block text-[11px] font-medium text-ed-text-muted mb-1 capitalize'
                        }
                    >{typeof fieldDef === 'object' ? fieldDef.label : field}</label>
                    <ItemFieldInput
                        fieldDef={fieldDef}
                        value={item[field]}
                        onChange={(next) => setField(field, next)}
                        device={device}
                    />
                </>
            )}
            {fieldDef && fieldDef.hint && <div className="list-item-hint mt-1 text-[11px] text-ed-text-muted">{fieldDef.hint}</div>}
        </div>
    ));
}

// Recursive editor for a nested `type: 'list'` field (e.g. menu submenus).
// Self-contained accordion state; calls onChange(nextArray). Supports its own
// nested lists, so it covers any depth.
function NestedList({items, itemSchema, onChange, device}) {
    const [open, setOpen] = useState(null);
    const list = items || [];
    const firstField = Object.keys(itemSchema)[0];
    const childrenField = Object.entries(itemSchema)
        .find(([, def]) => def && def.type === 'list')?.[0];
    const setItem = (idx, patch) => onChange(list.map((it, i) => i === idx ? {...it, ...patch} : it));
    const add = () => {
        const blank = {};
        Object.entries(itemSchema).forEach(([f, def]) => {
            if (def && def.default !== undefined) blank[f] = def.default;
            else if (def && (def.type === 'list' || def.type === 'multiSelect')) blank[f] = [];
            else blank[f] = '';
        });
        onChange([...list, blank]);
        setOpen(list.length);
    };
    const remove = (idx) => { onChange(list.filter((_, i) => i !== idx)); if (open === idx) setOpen(null); };
    return (
        // The indent rail makes the 1/2/3-level submenu hierarchy clear.
        <div className="list-editor nested flex flex-col gap-1 mt-0.5 pl-2.5 border-l-2 border-solid border-ed-primary">
            {list.map((item, idx) => {
                const isOpen = open === idx;
                const preview = item[firstField] || `#${idx + 1}`;
                const hasChildren = !!(childrenField && item[childrenField]?.length);
                return (
                    <div key={idx} className={listItemCls(isOpen, false)}>
                        <div className={listItemHeader(isOpen, true)} onClick={() => setOpen(isOpen ? null : idx)}>
                            <div className={listItemTitle}>
                                <span className={listItemGrip}>
                                    {hasChildren
                                        ? (isOpen
                                            ? <UI.ChevronDown size={14} strokeWidth={2}/>
                                            : <UI.ChevronRight size={14} strokeWidth={2}/>)
                                        : <UI.GripVertical size={14} strokeWidth={1.75}/>}
                                </span>
                                <span className={listItemPreview(true)}>{preview}</span>
                            </div>
                            <div className={listItemActions} onClick={(e) => e.stopPropagation()}>
                                <button className={btnIconDanger} onClick={() => remove(idx)} data-tooltip="Delete">
                                    <UI.Close size={14} strokeWidth={2}/>
                                </button>
                            </div>
                        </div>
                        {isOpen && (
                            <div className={listItemBody}>
                                <ItemFields
                                    itemSchema={itemSchema}
                                    item={item}
                                    device={device}
                                    setField={(field, next) => setItem(idx, {[field]: next})}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
            <button
                type="button"
                className="nested-add mt-1 w-full h-7 flex items-center justify-center gap-1 px-2.5 bg-transparent border border-dashed border-ed-border rounded text-ed-text-muted text-[12px] font-medium cursor-pointer [transition:border-color_0.1s,color_0.1s,background-color_0.1s] hover:border-ed-primary hover:text-ed-text hover:bg-ed-primary-soft"
                onClick={add}
            >+ Add item</button>
        </div>
    );
}

export function ListEditorField({
                                    propKey,
                                    schema,
                                    device,
                                    selectedBlock,
                                    updateBlockProp,
                                    listDrag,
                                    setListDrag,
                                    openAccordion,
                                    setOpenAccordion,
                                    getItemPreview,
                                    readOnly = false,
                                    onAddItem
                                }) {
    const key = propKey;
    const childrenField = Object.entries(schema.itemSchema)
        .find(([, def]) => def && def.type === 'list')?.[0];
    if (onAddItem && !(selectedBlock.props[key] || []).length) {
        return (
            <div className="list-empty flex flex-col items-start gap-2.5 p-3 rounded bg-ed-bg border border-solid border-ed-border">
                <p className="m-0 text-[12px] leading-[1.45] text-[#424242]">{schema.emptyText || 'Nothing here yet.'}</p>
                <button
                    type="button"
                    className="h-7 px-3 rounded border border-solid border-ed-primary bg-ed-surface text-[12px] font-medium text-ed-primary cursor-pointer [transition:background-color_0.1s,color_0.1s] hover:bg-ed-primary hover:text-white"
                    onClick={onAddItem}
                >
                    {schema.addLabel || 'Add item'}
                </button>
            </div>
        );
    }
    return (
        <div className="list-editor flex flex-col gap-1">
            {(selectedBlock.props[key] || []).map((item, itemIdx) => {
                const accKey = `${key}-${itemIdx}`;
                const isOpen = !readOnly && openAccordion === accKey;
                const firstField = Object.keys(schema.itemSchema)[0];
                const preview = (getItemPreview && getItemPreview(item)) || item[firstField] || `#${itemIdx + 1}`;
                const isDragSource = listDrag.key === key && listDrag.fromIdx === itemIdx;
                const isDragOver = listDrag.key === key && listDrag.overIdx === itemIdx && listDrag.fromIdx !== itemIdx;
                const hasChildren = !!(childrenField && item[childrenField]?.length);
                return (
                    <div
                        key={itemIdx}
                        className={listItemCls(isOpen, isDragSource)}
                        draggable
                        onDragStart={(e) => {
                            e.stopPropagation();
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', String(itemIdx));
                            setListDrag({key, fromIdx: itemIdx, overIdx: itemIdx, side: 'before'});
                        }}
                        onDragOver={(e) => {
                            if (listDrag.key !== key || listDrag.fromIdx == null) return;
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            const r = e.currentTarget.getBoundingClientRect();
                            const side = e.clientY < r.top + r.height / 2 ? 'before' : 'after';
                            if (listDrag.overIdx !== itemIdx || listDrag.side !== side) {
                                setListDrag((s) => ({...s, overIdx: itemIdx, side}));
                            }
                        }}
                        onDrop={(e) => {
                            if (listDrag.key !== key || listDrag.fromIdx == null) return;
                            e.preventDefault();
                            e.stopPropagation();
                            const from = listDrag.fromIdx;
                            let to = itemIdx + (listDrag.side === 'after' ? 1 : 0);
                            if (from < to) to -= 1;
                            if (from !== to) {
                                const arr = [...(selectedBlock.props[key] || [])];
                                const [moved] = arr.splice(from, 1);
                                arr.splice(to, 0, moved);
                                updateBlockProp(selectedBlock.id, key, arr);
                                if (openAccordion === `${key}-${from}`) setOpenAccordion(`${key}-${to}`);
                            }
                            setListDrag({key: null, fromIdx: null, overIdx: null, side: 'before'});
                        }}
                        onDragEnd={() => setListDrag({key: null, fromIdx: null, overIdx: null, side: 'before'})}
                    >
                        <div className={readOnly ? listItemHeader(false, false).replace('cursor-pointer', 'cursor-grab') : listItemHeader(isOpen, false)}
                             onClick={readOnly ? undefined : () => setOpenAccordion(isOpen ? null : accKey)}>
                            <div className={listItemTitle}>
                                    <span className={listItemGrip}>
                                      {hasChildren
                                          ? (isOpen
                                              ? <UI.ChevronDown size={14} strokeWidth={2}/>
                                              : <UI.ChevronRight size={14} strokeWidth={2}/>)
                                          : <UI.GripVertical size={14} strokeWidth={1.75}/>}
                                    </span>
                                {readOnly
                                    ? <span className="min-w-0 flex-1">{preview}</span>
                                    : <span className={listItemPreview(false)}>{preview}</span>}
                            </div>
                            <div className={listItemActions} onClick={(e) => e.stopPropagation()}>
                                <button className={btnIconDanger} onClick={() => {
                                    const arr = selectedBlock.props[key].filter((_, i) => i !== itemIdx);
                                    updateBlockProp(selectedBlock.id, key, arr);
                                    if (isOpen) setOpenAccordion(null);
                                }} data-tooltip="Delete"><UI.Close size={14} strokeWidth={2}/></button>
                            </div>
                        </div>
                        {isOpen && (
                            <div className={listItemBody}>
                                <ItemFields
                                    itemSchema={schema.itemSchema}
                                    item={item}
                                    device={device}
                                    setField={(field, next) => {
                                        const arr = selectedBlock.props[key].map((it, i) =>
                                            i === itemIdx ? {...it, [field]: next} : it
                                        );
                                        updateBlockProp(selectedBlock.id, key, arr);
                                    }}
                                />
                            </div>
                        )}
                        {isDragOver && <div className={dropLine(listDrag.side)} aria-hidden="true"/>}
                    </div>
                );
            })}
        </div>
    );
}