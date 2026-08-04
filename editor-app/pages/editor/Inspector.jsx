import { UI, BlockIcon } from '../../src/editor/Icon.jsx';
import { ColorSwatchesContext } from './lib/color.js';
import { styleFields } from './lib/styleFields.js';
import { sortBySubGroup } from './lib/fieldGroups.js';
import { AccordionSection } from './fields/AccordionSection.jsx';
import { StyleFieldRow } from './fields/StyleFieldRow.jsx';
import { PropFieldRow } from './fields/PropFieldRow.jsx';

export function Inspector({
  selectedBlock,
  selectedRegistry,
  device,
  frequentColors,
  hasOverride,
  resetOverride,
  updateBlockProp,
  updateBlockStyle,
  patchBlockStyle,
  openGroups,
  toggleGroup,
  openAccordion,
  setOpenAccordion,
  listDrag,
  setListDrag,
  duplicateBlock,
  deleteBlock,
}) {
  return (
              <ColorSwatchesContext.Provider value={frequentColors}>
                <div className="settings-header">
                  <div className="settings-header-icon"><BlockIcon name={selectedRegistry.icon} size={16} /></div>
                  <div className="settings-header-title">{selectedRegistry.label}</div>
                </div>

                {(() => {
                  const groups = new Map();
                  const ensure = (g) => {
                    if (!groups.has(g)) groups.set(g, []);
                    return groups.get(g);
                  };
                  for (const [key, schema] of Object.entries(selectedRegistry.propsSchema)) {
                    ensure(schema.group || 'Advanced').push({
                      source: 'prop', key, schema,
                    });
                  }
                  const hiddenStyleKeys = new Set(selectedRegistry.hideStyleFields || []);
                  const filteredStyle = styleFields.filter(
                    (s) => !(s.key in selectedRegistry.propsSchema) && !hiddenStyleKeys.has(s.key)
                  );
                  const regroup = selectedRegistry.regroupStyleFields || {};
                  for (const s of filteredStyle) {
                    const targetGroup = regroup[s.key] || s.group || 'Advanced';
                    ensure(targetGroup).push({
                      source: 'style', key: s.key, schema: s,
                    });
                  }
                  for (const items of groups.values()) items.sort(sortBySubGroup);
                  const inlinedPropKeys = new Set();
                  const inlinedStyleKeys = new Set();
                  for (const [, schemaEntry] of Object.entries(selectedRegistry.propsSchema)) {
                    if (schemaEntry?.inlineNumber?.key) inlinedPropKeys.add(schemaEntry.inlineNumber.key);
                  }
                  for (const s of styleFields) {
                    if (s?.inlineNumber?.key) inlinedStyleKeys.add(s.inlineNumber.key);
                  }
                  for (const items of groups.values()) {
                    for (let i = items.length - 1; i >= 0; i--) {
                      if (items[i].source === 'prop' && inlinedPropKeys.has(items[i].key)) items.splice(i, 1);
                      else if (items[i].source === 'style' && inlinedStyleKeys.has(items[i].key)) items.splice(i, 1);
                    }
                  }
                  return Array.from(groups.entries()).map(([groupName, items]) => {
                    const isCollapsible = groupName === 'Advanced';
                    const Wrapper = isCollapsible ? AccordionSection : 'div';
                    const wrapperProps = isCollapsible
                      ? {
                          name: groupName,
                          open: !!openGroups[groupName],
                          onToggle: () => toggleGroup(groupName),
                        }
                      : { className: 'inspector-component-fields' };
                    return (
                  <Wrapper key={`g-${groupName}`} {...wrapperProps}>
                {items.map((it) =>
                  it.source === 'style' ? (
                    <StyleFieldRow
                      key={`s-${it.schema.key}`}
                      s={it.schema}
                      selectedBlock={selectedBlock}
                      device={device}
                      hasOverride={hasOverride}
                      resetOverride={resetOverride}
                      updateBlockStyle={updateBlockStyle}
                      patchBlockStyle={patchBlockStyle}
                    />
                  ) : (
                    <PropFieldRow
                      key={`p-${it.key}`}
                      it={it}
                      selectedBlock={selectedBlock}
                      selectedRegistry={selectedRegistry}
                      device={device}
                      hasOverride={hasOverride}
                      resetOverride={resetOverride}
                      updateBlockProp={updateBlockProp}
                      listDrag={listDrag}
                      setListDrag={setListDrag}
                      openAccordion={openAccordion}
                      setOpenAccordion={setOpenAccordion}
                    />
                  )
                )}
                  </Wrapper>
                    );
                  });
                })()}

                <div className="block-actions-row">
                  <button className="btn-duplicate-block" onClick={() => duplicateBlock(selectedBlock.id)}>
                    <UI.Copy size={14} strokeWidth={1.75} /> Duplicate
                  </button>
                  <button className="btn-delete-block" onClick={() => deleteBlock(selectedBlock.id)}>
                    <UI.Trash size={14} strokeWidth={1.75} /> Delete
                  </button>
                </div>
              </ColorSwatchesContext.Provider>
  );
}
