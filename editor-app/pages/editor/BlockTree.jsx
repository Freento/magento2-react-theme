import { useEffect, useRef, useState } from 'react';
import { simulateGridPlacement } from 'editor-core/renderer';
import { ancestorsOf } from './lib/blockTree.js';
import { UI, BlockIcon } from '../../src/editor/Icon.jsx';
import registry from 'editor-core/registry';

export function BlockTree({
  areas,
  dragType,
  dragData,
  treeDropTarget,
  setTreeDropTarget,
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
  const [collapsed, setCollapsed] = useState(() => new Set());
  const toggleCollapsed = (id) => setCollapsed((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const expandedFor = useRef(null);
  useEffect(() => {
    if (!selectedBlockId || expandedFor.current === selectedBlockId) return;
    expandedFor.current = selectedBlockId;
    const ancestorIds = areas.flatMap((area) => ancestorsOf(area.blocks, selectedBlockId).map((a) => a?.id ?? a));
    if (!ancestorIds.length) return;
    setCollapsed((prev) => {
      if (!ancestorIds.some((id) => prev.has(id))) return prev;
      const next = new Set(prev);
      ancestorIds.forEach((id) => next.delete(id));
      return next;
    });
  }, [selectedBlockId, areas]);

  const cellGroups = (block) => {
    if (block.component !== 'Grid') return null;
    const sim = simulateGridPlacement(block);
    const groups = [];
    const byKey = new Map();
    block.children.forEach((child, i) => {
      const cc = sim.childCells[i];
      const key = cc ? `${cc.r}-${cc.c}` : 'auto';
      if (!byKey.has(key)) {
        const group = { key, cell: cc, blocks: [] };
        byKey.set(key, group);
        groups.push(group);
      }
      byKey.get(key).blocks.push(child);
    });
    if (groups.length < 2) return null;
    const multiRow = groups.some((g) => g.cell && g.cell.r > 1);
    return groups.map((g) => ({
      ...g,
      label: !g.cell ? 'Auto' : multiRow ? `Row ${g.cell.r} · Column ${g.cell.c}` : `Column ${g.cell.c}`,
    }));
  };

  const renderChildren = (block, depth, areaBlocks, areaId) => {
    const groups = cellGroups(block);
    if (!groups) return renderTreeNodes(block.children, depth + 1, areaBlocks, areaId);
    return groups.map((g) => (
      <div key={`${block.id}:${g.key}`} className="tree-cell">
        <div className="tree-cell-label pt-1.5 pb-0.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-e-text-soft" style={{ paddingLeft: 10 + (depth + 1) * 16 }}>{g.label}</div>
        {renderTreeNodes(g.blocks, depth + 2, areaBlocks, areaId)}
      </div>
    ));
  };

  const renderTreeNodes = (blocks, depth, areaBlocks, areaId) => {
    return blocks.map((block) => {
      const isSelf = dragType === 'reorder' && dragData === block.id;
      const showBefore = treeDropTarget?.blockId === block.id && treeDropTarget.position === 'before';
      const showAfter = treeDropTarget?.blockId === block.id && treeDropTarget.position === 'after';
      const showInside = treeDropTarget?.blockId === block.id && treeDropTarget.position === 'inside';
      const hasVisibleChildren = !!(block.children && block.children.length > 0 && !collapsed.has(block.id));
      const indent = 10 + depth * 16;
      return (
        <div key={block.id} className={`tree-node [&.tree-node--drop-after]:outline [&.tree-node--drop-after]:outline-2 [&.tree-node--drop-after]:outline-e-primary [&.tree-node--drop-after]:outline-offset-[-2px] [&.tree-node--drop-after]:rounded-e-sm [&.tree-node--drop-after]:bg-e-primary/[0.06]${showAfter && hasVisibleChildren ? ' tree-node--drop-after' : ''}`}>
          {showBefore && <div className="tree-drop-line relative h-0.5 mr-2 rounded-[1px] bg-e-primary" style={{ marginLeft: indent }} />}
          <div
            className={`tree-item group relative flex items-center justify-between h-[28px] pr-2 rounded-e-sm cursor-grab select-none transition-colors duration-[80ms] my-px text-e-text hover:bg-e-surface-hover before:content-[''] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:rounded-[2px] before:bg-transparent before:transition-colors before:duration-100 [&.selected]:bg-e-surface-sel [&.selected]:text-e-primary [&.selected]:before:bg-e-primary [&.dragging]:opacity-30 [&.tree-item--drop-inside]:outline [&.tree-item--drop-inside]:outline-2 [&.tree-item--drop-inside]:outline-e-primary [&.tree-item--drop-inside]:outline-offset-[-2px] [&.tree-item--drop-inside]:bg-e-primary/[0.06]${selectedBlockId === block.id ? ' selected' : ''}${isSelf ? ' dragging' : ''}${showInside ? ' tree-item--drop-inside' : ''}`}
            style={{ paddingLeft: indent }}
            draggable
            onDragStart={(e) => handleTreeDragStart(e, block.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleTreeDragOver(e, block, areaBlocks, areaId)}
            onDrop={handleTreeDrop}
            onClick={() => handleSelect(block.id, { keepTab: true, scrollIntoView: true })}
            onMouseEnter={() => setHoveredTreeId(block.id)}
            onMouseLeave={() => setHoveredTreeId((prev) => (prev === block.id ? null : prev))}
          >
            <span className="tree-item-label pointer-events-none flex items-center gap-2 text-[12.5px] whitespace-nowrap overflow-hidden text-ellipsis">
              {block.children && block.children.length > 0 ? (
                <button
                  type="button"
                  className="tree-item-toggle w-[18px] h-[18px] p-0 inline-flex items-center justify-center bg-transparent border-none text-e-text-soft cursor-pointer rounded-[3px] flex-shrink-0 mr-0.5 transition-all duration-100 hover:bg-white hover:text-e-text pointer-events-auto [.tree-item.selected_&]:text-e-primary"
                  aria-label={collapsed.has(block.id) ? 'Expand' : 'Collapse'}
                  aria-expanded={!collapsed.has(block.id)}
                  onClick={(e) => { e.stopPropagation(); toggleCollapsed(block.id); }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {collapsed.has(block.id)
                    ? <UI.ChevronRight size={12} strokeWidth={2} />
                    : <UI.ChevronDown size={12} strokeWidth={2} />}
                </button>
              ) : (
                <span className="tree-item-toggle w-[18px] h-[18px] inline-flex flex-shrink-0 mr-0.5 pointer-events-none" />
              )}
              <span className="tree-item-icon w-4 inline-flex items-center justify-center text-e-text-soft flex-shrink-0 [.tree-item.selected_&]:text-e-primary"><BlockIcon name={registry[block.component]?.icon} size={14} /></span>
              {registry[block.component]?.label || block.component}
              {showInside && <span className="tree-drop-inside-label ml-1.5 px-1.5 py-px rounded-[3px] bg-e-primary text-white text-[9px] font-semibold tracking-[0.04em] uppercase">inside</span>}
            </span>
            <span className="tree-item-actions flex gap-0.5 opacity-0 transition-opacity duration-100 group-hover:opacity-100 [.tree-item.selected_&]:opacity-100">
              <button className="btn-icon w-6 h-6 inline-flex items-center justify-center border-0 bg-transparent text-e-text-soft rounded-e-sm cursor-pointer transition-all duration-100 hover:bg-e-surface-hover hover:text-e-text" onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }} title="Duplicate block"><UI.Copy size={13} strokeWidth={1.75} /></button>
              <button className="btn-icon danger w-6 h-6 inline-flex items-center justify-center border-0 bg-transparent text-e-text-soft rounded-e-sm cursor-pointer transition-all duration-100 hover:bg-e-surface-hover hover:text-e-text [&.danger]:hover:bg-e-danger-soft [&.danger]:hover:text-e-danger" onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }} title="Delete block"><UI.Close size={14} strokeWidth={2} /></button>
            </span>
          </div>
          {hasVisibleChildren && renderChildren(block, depth, areaBlocks, areaId)}
          {showAfter && (
            <div className={`tree-drop-line relative h-0.5 mr-2 rounded-[1px] bg-e-primary [&.tree-drop-line--group]:h-[3px] [&.tree-drop-line--group]:!ml-0 [&.tree-drop-line--group]:mr-0 [&.tree-drop-line--group]:rounded-t-none [&.tree-drop-line--group]:rounded-b-e-sm${hasVisibleChildren ? ' tree-drop-line--group' : ''}`} style={{ marginLeft: indent }}>
              {hasVisibleChildren && <span className="tree-drop-line-label absolute right-1.5 bottom-1 px-1.5 py-px rounded-[3px] bg-e-primary text-white text-[9px] font-semibold tracking-[0.04em] uppercase whitespace-nowrap">after {registry[block.component]?.label || block.component}</span>}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setTreeDropTarget(null); }}>
      {areas.map((area) => (
        <div key={area.id} className="tree-area [&:not(:first-child)]:mt-[14px] [&:not(:first-child)]:pt-3 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-e-border">
          <div className="tree-area-title mt-0 mb-1.5 px-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-e-text-muted">{area.label}</div>
          {renderTreeNodes(area.blocks, 0, area.blocks, area.id)}
          {area.blocks.length === 0 && <div className="text-e-text-soft text-center py-[30px] px-5 text-[12.5px]">No blocks</div>}
        </div>
      ))}
    </div>
  );
}
