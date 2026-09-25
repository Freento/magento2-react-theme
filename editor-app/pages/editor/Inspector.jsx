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
  insideLink,
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
                <div className="flex items-center gap-2.5 mx-[-14px] py-3 px-[14px] bg-e-code-bg border-b border-solid border-e-code-border">
                  <div className="w-[30px] h-[30px] text-e-text flex items-center justify-center shrink-0"><BlockIcon name={selectedRegistry.icon} size={16} /></div>
                  <div className="text-[13px] font-semibold text-e-text">{selectedRegistry.label}</div>
                </div>

                {(() => {
                  const groups = new Map();
                  const ensure = (g) => {
                    if (!groups.has(g)) groups.set(g, []);
                    return groups.get(g);
                  };
                  // A field can depend on another prop's value — the carousel's
                  // category and its chosen list are alternatives, and showing
                  // both would ask the author to fill in something unused.
                  const visible = (schema) => {
                    const when = schema.showWhen;
                    if (!when) return true;
                    const current = selectedBlock.props?.[when.prop]
                      ?? selectedRegistry.defaultProps?.[when.prop];
                    return current === when.equals;
                  };
                  for (const [key, schema] of Object.entries(selectedRegistry.propsSchema)) {
                    // Inside a linked container this block renders no anchor of
                    // its own, so a link field would do nothing — the
                    // surrounding link already carries the click.
                    if (insideLink && key === 'href') continue;
                    if (!visible(schema)) continue;
                    ensure(schema.group || 'Advanced').push({
                      source: 'prop', key, schema,
                    });
                  }
                  const hiddenStyleKeys = new Set(selectedRegistry.hideStyleFields || []);
                  if (insideLink) hiddenStyleKeys.add('link');
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
                      : { className: 'flex flex-col gap-3 pt-[14px] pb-[18px]' };
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

                <div className="block-actions-row grid grid-cols-2 gap-1.5 mt-[18px]">
                  <button className="h-[34px] bg-e-surface text-e-text border border-e-border rounded-e cursor-pointer text-[12.5px] font-medium transition-all duration-100 inline-flex items-center justify-center gap-1.5 hover:border-e-primary-border hover:text-e-primary hover:bg-e-primary-soft" onClick={() => duplicateBlock(selectedBlock.id)}>
                    <UI.Copy size={14} strokeWidth={1.75} /> Duplicate
                  </button>
                  <button className="w-full h-[34px] bg-e-surface text-e-danger border border-e-border rounded-e cursor-pointer text-[12.5px] font-medium transition-all duration-100 inline-flex items-center justify-center gap-1.5 hover:bg-e-danger-soft hover:border-e-danger-border" onClick={() => deleteBlock(selectedBlock.id)}>
                    <UI.Trash size={14} strokeWidth={1.75} /> Delete
                  </button>
                </div>
              </ColorSwatchesContext.Provider>
  );
}
