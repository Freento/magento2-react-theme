import {UI} from '../../../src/editor/Icon.jsx';
import {ImageField} from './ImageField.jsx';
import {ColorField} from './ColorField.jsx';

export function ListEditorField({
                                    propKey,
                                    schema,
                                    selectedBlock,
                                    updateBlockProp,
                                    listDrag,
                                    setListDrag,
                                    openAccordion,
                                    setOpenAccordion
                                }) {
    const key = propKey;
    return (
        <div className="list-editor">
            {(selectedBlock.props[key] || []).map((item, itemIdx) => {
                const accKey = `${key}-${itemIdx}`;
                const isOpen = openAccordion === accKey;
                const firstField = Object.keys(schema.itemSchema)[0];
                const preview = item[firstField] || `#${itemIdx + 1}`;
                const isDragSource = listDrag.key === key && listDrag.fromIdx === itemIdx;
                const isDragOver = listDrag.key === key && listDrag.overIdx === itemIdx && listDrag.fromIdx !== itemIdx;
                return (
                    <div
                        key={itemIdx}
                        className={`list-item${isOpen ? ' open' : ''}${isDragSource ? ' dragging' : ''}${isDragOver ? ' drag-over' : ''}`}
                        draggable
                        onDragStart={(e) => {
                            e.stopPropagation();
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', String(itemIdx));
                            setListDrag({key, fromIdx: itemIdx, overIdx: itemIdx});
                        }}
                        onDragOver={(e) => {
                            if (listDrag.key !== key || listDrag.fromIdx == null) return;
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            if (listDrag.overIdx !== itemIdx) {
                                setListDrag((s) => ({...s, overIdx: itemIdx}));
                            }
                        }}
                        onDrop={(e) => {
                            if (listDrag.key !== key || listDrag.fromIdx == null) return;
                            e.preventDefault();
                            e.stopPropagation();
                            const from = listDrag.fromIdx;
                            const to = itemIdx;
                            if (from !== to) {
                                const arr = [...(selectedBlock.props[key] || [])];
                                const [moved] = arr.splice(from, 1);
                                arr.splice(to, 0, moved);
                                updateBlockProp(selectedBlock.id, key, arr);
                                if (isOpen) setOpenAccordion(`${key}-${to}`);
                                else if (openAccordion === `${key}-${from}`) setOpenAccordion(`${key}-${to}`);
                            }
                            setListDrag({key: null, fromIdx: null, overIdx: null});
                        }}
                        onDragEnd={() => setListDrag({key: null, fromIdx: null, overIdx: null})}
                    >
                        <div className="list-item-header"
                             onClick={() => setOpenAccordion(isOpen ? null : accKey)}>
                            <div className="list-item-title">
                                    <span className="list-item-grip">
                                      <UI.GripVertical size={14} strokeWidth={1.75}/>
                                    </span>
                                <span className="list-item-preview">{preview}</span>
                            </div>
                            <div className="list-item-actions" onClick={(e) => e.stopPropagation()}>
                                <button className="btn-icon danger" onClick={() => {
                                    const arr = selectedBlock.props[key].filter((_, i) => i !== itemIdx);
                                    updateBlockProp(selectedBlock.id, key, arr);
                                    if (isOpen) setOpenAccordion(null);
                                }} data-tooltip="Delete"><UI.Close size={14} strokeWidth={2}/></button>
                            </div>
                        </div>
                        {isOpen && (
                            <div className="list-item-body">
                                {Object.entries(schema.itemSchema).map(([field, fieldDef]) => {
                                    const fieldLabel = typeof fieldDef === 'object' ? fieldDef.label : field;
                                    const fieldType = typeof fieldDef === 'object' ? fieldDef.type : 'text';
                                    const updateItemField = (next) => {
                                        const arr = selectedBlock.props[key].map((it, i) =>
                                            i === itemIdx ? {...it, [field]: next} : it
                                        );
                                        updateBlockProp(selectedBlock.id, key, arr);
                                    };
                                    return (
                                        <div key={field} className="list-item-field">
                                            <label>{fieldLabel}</label>
                                            {fieldType === 'image' ? (
                                                <ImageField
                                                    value={item[field] || ''}
                                                    onChange={updateItemField}
                                                />
                                            ) : fieldType === 'textarea' ? (
                                                <textarea
                                                    value={item[field] || ''}
                                                    rows={3}
                                                    onChange={(e) => updateItemField(e.target.value)}
                                                />
                                            ) : fieldType === 'number' ? (
                                                <input
                                                    type="number"
                                                    value={item[field] ?? ''}
                                                    onChange={(e) => updateItemField(Number(e.target.value))}
                                                />
                                            ) : fieldType === 'boolean' ? (
                                                <input
                                                    type="checkbox"
                                                    checked={!!item[field]}
                                                    onChange={(e) => updateItemField(e.target.checked)}
                                                />
                                            ) : fieldType === 'color' ? (
                                                <ColorField
                                                    value={item[field] || ''}
                                                    onChange={updateItemField}
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={item[field] || ''}
                                                    onChange={(e) => updateItemField(e.target.value)}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
