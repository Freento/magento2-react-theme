import { useState } from 'react';
import { OverlayIconBtn, IconGripVertical, IconCopy, IconX } from '../overlay/icons.jsx';

export function CellStackWrapper({ parentId, cell, group, kids, childOptions, options, renderBlock }) {
  const [hovered, setHovered] = useState(false);
  const isEditing = !!childOptions.onSelect;
  const isSelected = options.selectedId && group.some((idx) => kids[idx]?.id === options.selectedId);
  const isTreeHovered = options.hoveredId && group.some((idx) => kids[idx]?.id === options.hoveredId);
  const isDropActive =
    !!childOptions.isDragging &&
    childOptions.dropTarget?.parentId === parentId &&
    childOptions.dropTarget?.cell?.r === cell.r &&
    childOptions.dropTarget?.cell?.c === cell.c;
  const outline = isSelected
    ? '2px solid #0F4C5C'
    : isTreeHovered
    ? '2px solid #9A9A95'
    : hovered
    ? '2px dashed #9A9A95'
    : '2px solid transparent';
  const dropSide = isDropActive ? childOptions.dropTarget?.side : null;
  return (
    <div
      data-cell-stack={`${parentId}:${cell.r}-${cell.c}`}
      draggable={isEditing}
      onDragStart={isEditing && childOptions.onCellDragStart ? (e) => {
        e.stopPropagation();
        try { e.dataTransfer.setData('text/plain', ''); e.dataTransfer.effectAllowed = 'move'; } catch {}
        childOptions.onCellDragStart({ parentId, cell });
      } : undefined}
      onDragEnd={childOptions.onDragEndBlock}
      onDragOver={isEditing && childOptions.onDropTargetChange ? (e) => {
        e.preventDefault();
        e.stopPropagation();
        const dragId = childOptions.isDragging;
        if (!dragId) return;
        const r = e.currentTarget.getBoundingClientRect();
        const side = (e.clientX - r.left) < r.width / 2 ? 'left' : 'right';
        childOptions.onDropTargetChange({ parentId, index: 0, cell, side });
      } : undefined}
      onMouseEnter={isEditing ? () => setHovered(true) : undefined}
      onMouseLeave={isEditing ? () => setHovered(false) : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 0,
        gridColumn: String(cell.c),
        gridRow: String(cell.r),
        minWidth: 0,
        position: 'relative',
        cursor: isEditing ? 'grab' : undefined,
        outline,
        outlineOffset: -1,
        transition: 'outline-color 0.15s',
        pointerEvents: isEditing ? 'auto' : undefined,
      }}
    >
      {dropSide && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -4,
            bottom: -4,
            [dropSide]: -3,
            width: 4,
            background: '#0F4C5C',
            borderRadius: 2,
            zIndex: 20,
            pointerEvents: 'none',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.85)',
          }}
        />
      )}
      {isEditing && (hovered || isSelected) && (
        <>
          <span
            title="Drag cell"
            aria-label="Cell drag handle"
            style={{
              position: 'absolute', top: 0, right: 50,
              width: 22, height: 22,
              background: '#ffffff', border: '1px solid #e5e7eb', color: '#525252',
              borderRadius: 4, cursor: 'grab', zIndex: 12,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              userSelect: 'none', pointerEvents: 'auto',
            }}
          >
            <IconGripVertical />
          </span>
          {childOptions.onCellDuplicate && (
            <div
              style={{ position: 'absolute', top: 0, right: 25, zIndex: 12 }}
              onMouseDown={(e) => e.stopPropagation()}
              onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <OverlayIconBtn
                title="Duplicate cell"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); childOptions.onCellDuplicate({ parentId, cell }); }}
              >
                <IconCopy />
              </OverlayIconBtn>
            </div>
          )}
          {childOptions.onCellDelete && (
            <div
              style={{ position: 'absolute', top: 0, right: 0, zIndex: 12 }}
              onMouseDown={(e) => e.stopPropagation()}
              onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <OverlayIconBtn
                title="Delete cell"
                intent="danger"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); childOptions.onCellDelete({ parentId, cell }); }}
              >
                <IconX />
              </OverlayIconBtn>
            </div>
          )}
        </>
      )}
      {group.map((idx) =>
        renderBlock(kids[idx], idx, parentId, {
          ...childOptions,
          myCell: cell,
          inStack: true,
        })
      )}
    </div>
  );
}
