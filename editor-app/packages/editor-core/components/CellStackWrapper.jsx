import { useState } from 'react';
import { OverlayIconBtn, IconGripVertical, IconCopy, IconX, useHoverTip } from '../overlay/icons.jsx';

export function CellStackWrapper({ parentId, cell, group, kids, childOptions, options, renderBlock }) {
  const [hovered, setHovered] = useState(false);
  const cellTip = useHoverTip('Drag cell');
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
    ? '2px solid #6F6F6B'
    : hovered
    ? '2px dashed #6F6F6B'
    : '2px solid transparent';
  const dropSide = isDropActive ? childOptions.dropTarget?.side : null;
  const showControls = isEditing && hovered;
  const locked = !!childOptions.isLocked && group.some((idx) => childOptions.isLocked(kids[idx]));
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
        const cur = childOptions.dropTarget;
        const emit = (dt) => {
          if (
            cur &&
            cur.parentId === dt.parentId &&
            cur.index === dt.index &&
            cur.side === dt.side &&
            cur.cell?.r === dt.cell?.r &&
            cur.cell?.c === dt.cell?.c
          ) return;
          childOptions.onDropTargetChange(dt);
        };
        const r = e.currentTarget.getBoundingClientRect();
        if (dragId === 'cell') {
          const side = (e.clientX - r.left) < r.width / 2 ? 'left' : 'right';
          emit({ parentId, index: 0, cell, side });
          return;
        }
        const blockEls = [...e.currentTarget.querySelectorAll(':scope > [data-block-id]')];
        let pos = blockEls.length;
        for (let i = 0; i < blockEls.length; i++) {
          const br = blockEls[i].getBoundingClientRect();
          if (e.clientY < br.top + br.height / 2) { pos = i; break; }
        }
        const index = pos < group.length ? group[pos] : group[group.length - 1] + 1;
        emit({ parentId, index, cell });
      } : undefined}
      onMouseOver={isEditing ? (e) => setHovered(e.target?.closest?.('[data-block-id],[data-cell-stack]') === e.currentTarget) : undefined}
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
      {showControls && (
        <>
          <span
            ref={cellTip.ref}
            aria-label="Drag cell"
            {...cellTip.hoverProps}
            style={{
              position: 'absolute', top: 0, right: 50,
              width: 22, height: 22,
              background: '#ffffff', border: '1px solid #B9B9B4', color: '#424242',
              borderRadius: 4, cursor: 'grab', zIndex: 12,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              userSelect: 'none', pointerEvents: 'auto',
            }}
          >
            <IconGripVertical />
            {cellTip.tip}
          </span>
          {childOptions.onCellDuplicate && !locked && (
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
          {childOptions.onCellDelete && !locked && (
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
          stackLast: idx === group[group.length - 1],
        })
      )}
    </div>
  );
}
