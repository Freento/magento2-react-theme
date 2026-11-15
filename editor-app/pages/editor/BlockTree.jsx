import { useCallback, useEffect, useRef } from 'react';
import { simulateGridPlacement } from 'editor-core/renderer';
import { UI, BlockIcon } from '../../src/editor/Icon.jsx';
import registry from 'editor-core/registry';
import { btnIcon, btnIconDanger } from './lib/cls.js';
import { holdsSystemBlock } from './lib/blockTree.js';
import { richToPlain, plainToRich } from 'editor-core/lib/richText';

const treeLabel = (block) => {
  const label = registry[block.component]?.label || block.component;
  if (block.component !== 'Text' && block.component !== 'Heading') return label;
  const p = block.props || {};
  const level = block.component === 'Heading' ? p.level || 2 : p.level;
  const kind = [1, 2, 3, 4].includes(Number(level)) ? `H${Number(level)}` : 'Text';
  const snippet = richToPlain(p.html != null && p.html !== '' ? p.html : plainToRich(p.text || ''));
  return (
    <span className="truncate">
      {kind}
      {snippet && <span className="text-ed-text-soft"> · {snippet}</span>}
    </span>
  );
};


export function BlockTree({
  sections,
  dragType,
  dragData,
  treeDropTarget,
  setTreeDropTarget,
  expanded,
  setExpanded,
  selectedBlockId,
  setHoveredTreeId,
  handleTreeDragStart,
  handleDragEnd,
  handleTreeDragOver,
  handleTreeDrop,
  handleSelect,
  duplicateBlock,
  deleteBlock,
}) {
  const selectedRef = useRef(null);
  const toggleCollapsed = useCallback((id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedBlockId]);

  const findAncestorPath = (blocks, id, path = []) => {
    for (const b of blocks) {
      if (b.id === id) return path;
      if (b.children) {
        const res = findAncestorPath(b.children, id, [...path, b.id]);
        if (res !== null) return res;
      }
    }
    return null;
  };
  const findAncestorPathInSections = (id) => {
    for (const section of sections) {
      const res = findAncestorPath(section.blocks, id);
      if (res !== null) return res;
    }
    return [];
  };
  // Guides on the path to the selected block (and its own subtree) light up.
  const ancestorPath = selectedBlockId ? findAncestorPathInSections(selectedBlockId) : [];
  const activeGuideIds = new Set(selectedBlockId ? [...ancestorPath, selectedBlockId] : []);

  const revealedFor = useRef(null);
  useEffect(() => {
    if (!selectedBlockId || revealedFor.current === selectedBlockId) return;
    revealedFor.current = selectedBlockId;
    setExpanded((prev) => {
      if (ancestorPath.every((id) => prev.has(id))) return prev;
      const next = new Set(prev);
      ancestorPath.forEach((id) => next.add(id));
      return next;
    });
  }, [selectedBlockId, ancestorPath]);

  const cellGroups = (block) => {
    if (block.component !== 'Grid' || !block.children?.length) return null;
    const { childCells } = simulateGridPlacement(block);
    const groups = [];
    const byKey = new Map();
    block.children.forEach((child, i) => {
      const cell = childCells[i];
      const key = cell ? `${cell.r}-${cell.c}` : 'auto';
      if (!byKey.has(key)) {
        const group = { key, cell, blocks: [] };
        byKey.set(key, group);
        groups.push(group);
      }
      byKey.get(key).blocks.push(child);
    });
    if (groups.length < 2) return null;
    return groups;
  };

  const renderGuides = (depth, ancestors) =>
    Array.from({ length: depth }).map((_, i) => (
      <span
        key={i}
        className={
          'tree-guide absolute -top-px -bottom-px w-px pointer-events-none ' +
          (activeGuideIds.has(ancestors[i]) ? 'active bg-ed-primary' : 'bg-ed-border')
        }
        style={{ left: 19 + i * 16 }}
        aria-hidden="true"
      />
    ));

  const renderChildren = (block, depth, rootBlocks, ancestors, target) => {
    const groups = cellGroups(block);
    if (!groups) return renderTreeNodes(block.children, depth + 1, rootBlocks, [...ancestors, block.id], target);
    return groups.map((g) => (
      <div key={`${block.id}:${g.key}`} className="tree-cell">
        {renderTreeNodes(g.blocks, depth + 1, rootBlocks, [...ancestors, block.id], target, g.cell)}
      </div>
    ));
  };

  const renderTreeNodes = (blocks, depth, rootBlocks, ancestors = [], target, groupCell) => {
    return blocks.map((block) => {
      const isSelf = dragType === 'reorder' && dragData === block.id;
      const isSelected = selectedBlockId === block.id;
      const showBefore = treeDropTarget?.blockId === block.id && treeDropTarget.position === 'before';
      const showAfter = treeDropTarget?.blockId === block.id && treeDropTarget.position === 'after';
      const showInside = treeDropTarget?.blockId === block.id && treeDropTarget.position === 'inside';
      const hasChildren = !!block.children?.length;
      const isCollapsed = !expanded.has(block.id);
      return (
        <div key={block.id} className="relative">
          <div
            ref={isSelected ? selectedRef : null}
            data-tree-id={block.id}
            className={[
              `tree-item${isSelected ? ' selected' : ''}${isSelf ? ' dragging' : ''}`,
              'group h-7 pr-2 rounded cursor-grab flex items-center justify-between select-none',
              '[transition:background_0.08s] my-px relative',
              "before:content-[''] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5",
              'before:rounded-[2px] before:[transition:background_0.1s]',
              isSelected
                ? 'bg-[rgba(15,76,92,0.12)] text-ed-primary font-medium before:bg-ed-primary'
                : 'text-ed-text before:bg-transparent hover:bg-ed-surface-hover-strong',
              isSelf ? 'opacity-30' : '',
            ].join(' ')}
            style={{
              paddingLeft: 10 + depth * 16,
              outline: showInside ? '2px solid #0F4C5C' : 'none',
              outlineOffset: -2,
              borderRadius: showInside ? 6 : undefined,
            }}
            draggable
            onDragStart={(e) => handleTreeDragStart(e, block.id)}
            onDragEnd={handleDragEnd}
            onDragEnter={(e) => { if (dragType) e.preventDefault(); }}
            onDragOver={(e) => handleTreeDragOver(e, block, rootBlocks, target, groupCell)}
            onDrop={handleTreeDrop}
            onClick={() => {
              handleSelect(block.id);
              document.querySelector(`[data-block-id="${CSS.escape(block.id)}"]`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            onMouseEnter={() => setHoveredTreeId(block.id)}
            onMouseLeave={() => setHoveredTreeId((prev) => (prev === block.id ? null : prev))}
          >
            {renderGuides(depth, ancestors)}
            <span className="tree-item-label pointer-events-none flex items-center gap-1.5 text-[12.5px] truncate">
              {hasChildren ? (
                <button
                  type="button"
                  className="tree-item-toggle pointer-events-auto inline-flex h-[18px] w-[18px] shrink-0 cursor-pointer items-center justify-center rounded-[3px] border-none bg-transparent text-ed-text-soft [transition:background_0.1s] hover:bg-ed-surface-hover-strong"
                  aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                  aria-expanded={!isCollapsed}
                  onClick={(e) => { e.stopPropagation(); toggleCollapsed(block.id); }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {isCollapsed
                    ? <UI.ChevronRight size={12} strokeWidth={2} />
                    : <UI.ChevronDown size={12} strokeWidth={2} />}
                </button>
              ) : (
                <span className="tree-item-toggle inline-flex h-[18px] w-[18px] shrink-0" />
              )}
              <span
                className={
                  'tree-item-icon w-4 inline-flex items-center justify-center shrink-0 ' +
                  (isSelected ? 'text-ed-primary' : 'text-ed-text-soft')
                }
              ><BlockIcon name={registry[block.component]?.icon} size={14} /></span>
              {treeLabel(block)}
              {showInside && <span style={{ fontSize: 9, color: '#0F4C5C', marginLeft: 4 }}>← here</span>}
            </span>
            <span
              className={
                'tree-item-actions flex gap-0.5 [transition:opacity_0.1s] ' +
                (isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')
              }
            >
              {!holdsSystemBlock(block) && (
                <>
                  <button className={btnIcon} onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }} data-tooltip="Duplicate block" aria-label="Duplicate block"><UI.Copy size={13} strokeWidth={1.75} /></button>
                  <button className={btnIconDanger} onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }} data-tooltip="Delete block"><UI.Close size={14} strokeWidth={2} /></button>
                </>
              )}
            </span>
          </div>
          {hasChildren && !isCollapsed && renderChildren(block, depth, rootBlocks, ancestors, target)}
          {(showBefore || showAfter) && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-2 right-2 z-[1] h-0.5 rounded-[1px] bg-[#0F4C5C]"
              style={{ [showBefore ? 'top' : 'bottom']: -1 }}
            />
          )}
        </div>
      );
    });
  };

  return (
    <div
      className="min-h-full"
      onDragEnter={(e) => { if (dragType) e.preventDefault(); }}
      onDragOver={(e) => { if (dragType) e.preventDefault(); }}
      onDrop={handleTreeDrop}
      onDragLeave={(e) => {
        const next = e.relatedTarget || document.elementFromPoint(e.clientX, e.clientY);
        if (!next || !e.currentTarget.contains(next)) setTreeDropTarget(null);
      }}
    >
      {sections.map((section, i) => {
        const headerId = `section:${section.key}`;
        const isTarget = treeDropTarget?.blockId === headerId;
        return (
          <div key={section.key} className={i > 0 ? 'mt-2 border-t border-solid border-ed-border pt-1' : ''}>
            <div
              data-tree-section={section.key}
              className={
                'tree-section-label mx-1 my-0.5 rounded px-1.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ' +
                (isTarget ? 'text-[#0F4C5C]' : 'text-ed-text-muted')
              }
              style={{ outline: isTarget ? '2px solid #0F4C5C' : 'none', outlineOffset: -2 }}
              onDragOver={(e) => {
                if (!dragType) return;
                e.preventDefault();
                e.stopPropagation();
                const next = { blockId: headerId, position: 'inside', parentId: 'root-page', index: section.blocks.length, target: section.key };
                setTreeDropTarget((cur) => (cur && cur.blockId === headerId && cur.index === next.index ? cur : next));
              }}
            >
              {section.label}
              {isTarget && <span style={{ fontSize: 9, marginLeft: 4, textTransform: 'none', letterSpacing: 0 }}>← here</span>}
            </div>
            {section.blocks.length
              ? renderTreeNodes(section.blocks, 0, section.blocks, [], section.key)
              : <div className="px-3 py-1 text-[11px] text-ed-text-soft">No blocks</div>}
          </div>
        );
      })}
    </div>
  );
}
