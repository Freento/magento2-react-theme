import { Fragment } from 'react';
import { UI, BlockIcon } from '../../src/editor/Icon.jsx';
import { ColorSwatchesContext } from './lib/color.js';
import { styleFields } from './lib/styleFields.js';
import { groupFields, sortBySubGroup } from './lib/fieldGroups.js';
import { AccordionSection } from './fields/AccordionSection.jsx';
import { StyleFieldRow } from './fields/StyleFieldRow.jsx';
import { PropFieldRow } from './fields/PropFieldRow.jsx';
import { holdsSystemBlock } from './lib/blockTree.js';

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
  copyBlock,
  cutBlock,
  deleteBlock,
  onSelectParent,
}) {
  return (
              <ColorSwatchesContext.Provider value={frequentColors}>
                <div
                  className={`settings-header sticky top-0 z-[5] flex items-center gap-2.5 -mx-3.5 px-3.5 py-3 bg-ed-code-bg border-b border-solid border-ed-code-border${onSelectParent ? ' cursor-pointer hover:text-ed-primary' : ''}`}
                  data-tooltip={onSelectParent ? 'Go to the parent block' : undefined}
                  onClick={onSelectParent || undefined}
                >
                  {onSelectParent && (
                    <div className="settings-header-up w-[18px] h-[30px] -ml-1 text-ed-text-muted flex items-center justify-center shrink-0"><UI.ChevronLeft size={16} strokeWidth={2} /></div>
                  )}
                  <div className="settings-header-icon w-[30px] h-[30px] text-ed-text flex items-center justify-center shrink-0"><BlockIcon name={selectedRegistry.icon} size={16} /></div>
                  <div className="settings-header-title text-[13px] font-semibold text-ed-text">{selectedRegistry.label}</div>
                  <button
                    type="button"
                    className="settings-header-locate w-7 h-7 ml-auto shrink-0 inline-flex items-center justify-center rounded border-none bg-transparent cursor-pointer text-[#424242] hover:bg-ed-surface-hover hover:text-ed-primary"
                    data-tooltip="Scroll to this block on the page"
                    aria-label="Scroll to this block on the page"
                    onClick={(e) => {
                      e.stopPropagation();
                      const el = document.querySelector(`[data-block-id="${CSS.escape(String(selectedBlock.id))}"]`);
                      const scroller = el?.closest('.editor-preview');
                      if (!el || !scroller) { el?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
                      const view = scroller.getBoundingClientRect();
                      const pins = [...scroller.querySelectorAll('*')].filter((n) => {
                        if (n.contains(el)) return false;
                        const cs = getComputedStyle(n);
                        return (cs.position === 'sticky' || cs.position === 'fixed') && n.offsetHeight && cs.display !== 'none' && cs.visibility !== 'hidden';
                      });
                      const coverAfter = (shift) => pins.reduce((cover, n) => {
                        const cs = getComputedStyle(n);
                        const top = parseFloat(cs.top) || 0;
                        const h = n.offsetHeight;
                        const box = n.parentElement;
                        if (cs.position === 'sticky' && box && box !== scroller) {
                          const r = box.getBoundingClientRect();
                          const line = view.top + top;
                          if (r.top - shift > line || r.bottom - shift < line + h) return cover;
                        }
                        return Math.max(cover, top + h);
                      }, 0);
                      const delta = el.getBoundingClientRect().top - view.top;
                      let shift = delta - coverAfter(0) - 40;
                      for (let i = 0; i < 3; i++) shift = delta - coverAfter(shift) - 40;
                      const target = Math.max(0, Math.min(scroller.scrollTop + shift, scroller.scrollHeight - scroller.clientHeight));
                      scroller.scrollTo({ top: target, behavior: 'smooth' });
                    }}
                  >
                    <UI.Locate size={16} strokeWidth={1.75} />
                  </button>
                </div>

                {(() => {
                  // `showIf(props)` on a field hides it until its condition holds
                  // (e.g. show the product list only for the "products" source).
                  const resolvedProps = { ...selectedRegistry.defaultProps, ...selectedBlock.props };
                  const propEntries = Object.entries(selectedRegistry.propsSchema)
                    .filter(([key]) => !(insideLink && key === 'href'))
                    .filter(([, schema]) => !(typeof schema.showIf === 'function' && !schema.showIf(resolvedProps)))
                    .map(([key, schema]) => ({
                      source: 'prop',
                      key,
                      schema: {
                        ...schema,
                        label: typeof schema.label === 'function' ? schema.label(resolvedProps) : schema.label,
                        options: typeof schema.options === 'function' ? schema.options(resolvedProps) : schema.options,
                      },
                    }));
                  // hideStyleFields: true hides the whole style/Advanced group;
                  // an array hides specific style keys.
                  const hideAllStyle = selectedRegistry.hideStyleFields === true;
                  const hiddenStyleKeys = new Set(Array.isArray(selectedRegistry.hideStyleFields) ? selectedRegistry.hideStyleFields : []);
                  if (insideLink) hiddenStyleKeys.add('link');
                  const filteredStyle = hideAllStyle ? [] : styleFields.filter(
                    (s) => !(s.key in selectedRegistry.propsSchema) && !hiddenStyleKeys.has(s.key)
                      && !(s.containerOnly && !selectedRegistry.acceptsChildren)
                      && !(typeof s.showIf === 'function' && !s.showIf(selectedBlock.style || {}))
                  );
                  const regroup = selectedRegistry.regroupStyleFields || {};
                  const styleEntries = filteredStyle.map((s) => ({ source: 'style', key: s.key, schema: s }));
                  const groups = groupFields(
                    [...propEntries, ...styleEntries],
                    (e) => (e.source === 'prop' ? e.schema.group : regroup[e.key] || e.schema.group)
                  );
                  for (const [name, items] of groups) if (!(selectedRegistry.keepFieldOrder && name !== 'Advanced')) items.sort((a, b) => sortBySubGroup(a, b, selectedRegistry.fieldSubgroups));
                  const inlinedPropKeys = new Set();
                  for (const [, schemaEntry] of Object.entries(selectedRegistry.propsSchema)) {
                    if (schemaEntry?.inlineNumber?.key) inlinedPropKeys.add(schemaEntry.inlineNumber.key);
                  }
                  for (const items of groups.values()) {
                    for (let i = items.length - 1; i >= 0; i--) {
                      if (items[i].source === 'prop' && inlinedPropKeys.has(items[i].key)) items.splice(i, 1);
                    }
                  }
                  return Array.from(groups.entries()).map(([groupName, items], groupIndex) => {
                    const isCollapsible = groupName === 'Advanced';
                    const Wrapper = isCollapsible ? AccordionSection : 'div';
                    const wrapperProps = isCollapsible
                      ? {
                          name: groupName,
                          open: !!openGroups[groupName],
                          onToggle: () => toggleGroup(groupName),
                        }
                      : { className: 'inspector-component-fields flex flex-col gap-3 pt-3.5 pb-[18px]' };
                    return (
                  <Wrapper key={`g-${groupName}`} {...wrapperProps}>
                {groupIndex === 0 && device !== 'desktop' && (
                  <div className="inspector-device-note flex gap-2 px-2.5 py-2 rounded bg-ed-primary-soft text-[12px] leading-[1.45] text-[#424242]">
                    <UI.Info size={14} strokeWidth={2} className="shrink-0 mt-px text-ed-primary" />
                    <span>
                      {device === 'mobile'
                        ? 'Editing the Mobile view: changes to these settings apply to mobile only.'
                        : 'Editing the Tablet view: changes to these settings apply to tablet and mobile, unless mobile has its own value.'}
                    </span>
                  </div>
                )}
                {groupIndex === 0 && selectedRegistry.panelNote && (
                  <div className="inspector-note flex gap-2 px-2.5 py-2 rounded bg-ed-primary-soft text-[12px] leading-[1.45] text-[#424242]">
                    <UI.Info size={14} strokeWidth={2} className="shrink-0 mt-px text-ed-primary" />
                    <span>{selectedRegistry.panelNote}</span>
                  </div>
                )}
                {items.map((it, index) => {
                  if (it.skip) return null;
                  const propRow = (entry) => (
                    <PropFieldRow
                      key={`p-${entry.key}`}
                      it={entry}
                      selectedBlock={selectedBlock}
                      selectedRegistry={selectedRegistry}
                      device={device}
                      hasOverride={hasOverride}
                      resetOverride={resetOverride}
                      updateBlockProp={updateBlockProp}
                      updateBlockStyle={updateBlockStyle}
                      listDrag={listDrag}
                      setListDrag={setListDrag}
                      openAccordion={openAccordion}
                      setOpenAccordion={setOpenAccordion}
                    />
                  );
                  const row = (entry) => (entry.source === 'style' ? styleRow(entry) : propRow(entry));
                  const styleRow = (entry) => (
                    <StyleFieldRow
                      key={`s-${entry.schema.key}`}
                      s={entry.schema}
                      selectedBlock={selectedBlock}
                      selectedRegistry={selectedRegistry}
                      device={device}
                      hasOverride={hasOverride}
                      resetOverride={resetOverride}
                      updateBlockStyle={updateBlockStyle}
                      patchBlockStyle={patchBlockStyle}
                    />
                  );
                  // Spacing boxes sit side by side, half the width each; the two
                  // screen switches follow one another.
                  const next = items[index + 1];
                  const isSpacing = (e) => !!e && !e.skip && (e.source === 'style' ? e.schema.type : e.schema?.type) === 'spacing';
                  if (selectedRegistry.spacingSideBySide && isSpacing(it) && isSpacing(next)) {
                    next.skip = true;
                    const keyOf = (e) => (e.source === 'style' ? e.schema.key : e.key);
                    const [first, second] = keyOf(it) === 'margin' || keyOf(next) !== 'margin' ? [it, next] : [next, it];
                    return (
                      <div key={`pair-${keyOf(it)}`} className="grid grid-cols-2 [&>*:first-child]:pr-3 [&>*+*]:pl-3 [&>*+*]:border-l [&>*+*]:border-solid [&>*+*]:border-ed-border">
                        {row(first)}
                        {row(second)}
                      </div>
                    );
                  }
                  if (it.source === 'style' && it.schema.key === 'hidden') {
                    const stretch = items.find((e) => e.source === 'style' && e.schema.key === 'fullWidth');
                    if (stretch) {
                      stretch.skip = true;
                      return (
                        <Fragment key="screen-switches">
                          {styleRow(it)}
                          {styleRow(stretch)}
                        </Fragment>
                      );
                    }
                  }
                  return row(it);
                })}
                  </Wrapper>
                    );
                  });
                })()}


                {!holdsSystemBlock(selectedBlock) && (
                  <div className="block-actions-row grid grid-cols-2 gap-1.5 mt-[18px]">
                    <button
                      className="btn-copy-block h-[34px] bg-ed-surface text-ed-text border border-solid border-ed-border rounded cursor-pointer text-[12.5px] font-medium inline-flex items-center justify-center gap-1.5 [transition:all_0.1s] hover:border-ed-primary hover:text-ed-primary hover:bg-ed-primary-soft"
                      onClick={() => copyBlock(selectedBlock.id)}
                      data-tooltip="Copy (Ctrl+C), then paste on any page with Ctrl+V"
                    >
                      <UI.Clipboard size={14} strokeWidth={1.75} /> Copy
                    </button>
                    <button
                      className="btn-cut-block h-[34px] bg-ed-surface text-ed-text border border-solid border-ed-border rounded cursor-pointer text-[12.5px] font-medium inline-flex items-center justify-center gap-1.5 [transition:all_0.1s] hover:border-ed-primary hover:text-ed-primary hover:bg-ed-primary-soft"
                      onClick={() => cutBlock(selectedBlock.id)}
                      data-tooltip="Cut (Ctrl+X), then paste on any page with Ctrl+V"
                    >
                      <UI.Scissors size={14} strokeWidth={1.75} /> Cut
                    </button>
                    <button
                      className="btn-duplicate-block h-[34px] bg-ed-surface text-ed-text border border-solid border-ed-border rounded cursor-pointer text-[12.5px] font-medium inline-flex items-center justify-center gap-1.5 [transition:all_0.1s] hover:border-ed-primary hover:text-ed-primary hover:bg-ed-primary-soft"
                      onClick={() => duplicateBlock(selectedBlock.id)}
                    >
                      <UI.Copy size={14} strokeWidth={1.75} /> Duplicate
                    </button>
                    <button
                      className="btn-delete-block w-full h-[34px] bg-ed-surface text-ed-danger border border-solid border-ed-border rounded cursor-pointer text-[12.5px] font-medium inline-flex items-center justify-center gap-1.5 [transition:all_0.1s] hover:bg-ed-danger-soft hover:border-ed-danger-border"
                      onClick={() => deleteBlock(selectedBlock.id)}
                    >
                      <UI.Trash size={14} strokeWidth={1.75} /> Delete
                    </button>
                  </div>
                )}
              </ColorSwatchesContext.Provider>
  );
}
