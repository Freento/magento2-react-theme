import { useState, useCallback } from 'react';
import { DropIndicator, OverlayIconBtn, IconGripVertical, IconCopy, IconX } from '../overlay/icons.jsx';
import { GridSizeControls } from './GridSizeControls.jsx';
import registry from '../registry-runtime.js';

export function BlockWrapper({ block, index, parentId, totalCount, onSelect, onDelete, onDuplicate, onUpdateProp, selectedId, hoveredId, isDragging, dropTarget, onDropTargetChange, onDragStartBlock, onDragEndBlock, inGrid, horizontal, gridLinear, gridCols, myCell, inStack, children }) {
  const isHorizontal = inGrid || horizontal;
  const [hovered, setHovered] = useState(false);
  const isSelected = selectedId === block.id;
  const isTreeHovered = hoveredId === block.id;
  const isEditing = !!onSelect;
  const isSelfDragging = isDragging === block.id;
  const acceptsChildren = registry[block.component]?.acceptsChildren;

  const notSelf = isDragging !== block.id;
  const showZones = isDragging && notSelf && !isHorizontal;
  const showSideZones = isDragging && notSelf && isHorizontal;

  const isBefore = (showZones || showSideZones) && dropTarget?.parentId === parentId && dropTarget?.index === index;
  const isAfter = (showZones || showSideZones) && dropTarget?.parentId === parentId && dropTarget?.index === index + 1 && index === totalCount - 1;
  const isInside = (showZones || showSideZones) && dropTarget?.parentId === block.id;
  const isEmptyContainer = !!onSelect && acceptsChildren && (block.children?.length || 0) === 0;

  const isCellDropTarget =
    isDragging === 'cell' &&
    inGrid &&
    myCell &&
    dropTarget?.parentId === parentId &&
    dropTarget?.cell?.r === myCell.r &&
    dropTarget?.cell?.c === myCell.c;

  const getOutline = () => {
    if (isInside) return '2px solid #0F4C5C';
    if (isSelected) return '2px solid #0F4C5C';
    if (isTreeHovered) return '2px solid #9A9A95';
    if (hovered && !isDragging) return '2px dashed #9A9A95';
    if (isEmptyContainer) return '1px dashed #cbd5e1';
    return '2px solid transparent';
  };
  const cellDropSide = isCellDropTarget ? dropTarget?.side : null;

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSelfDragging) return;
    if (!isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    if (block.component === 'Grid') {
      const edge = 32;
      if (e.clientY < rect.top + edge) {
        onDropTargetChange({ parentId, index });
        return;
      }
      if (e.clientY > rect.bottom - edge) {
        onDropTargetChange({ parentId, index: index + 1 });
        return;
      }
      onDropTargetChange({ parentId: block.id, index: (block.children || []).length });
      return;
    }

    if (isHorizontal) {
      const x = e.clientX - rect.left;
      const w = rect.width;
      const cellAfter = inGrid && myCell ? { r: myCell.r, c: myCell.c } : undefined;
      if (isDragging === 'cell' && cellAfter) {
        const sideC = x < w / 2 ? 'left' : 'right';
        onDropTargetChange({ parentId, index: 0, cell: cellAfter, side: sideC });
        return;
      }
      if (x < w * 0.3) {
        onDropTargetChange({ parentId, index });
        return;
      }
      if (x > w * 0.7) {
        onDropTargetChange({ parentId, index: index + 1, cell: cellAfter });
        return;
      }
      if (acceptsChildren) {
        onDropTargetChange({ parentId: block.id, index: (block.children || []).length });
        return;
      }
      onDropTargetChange({ parentId, index: index + 1, cell: cellAfter });
      return;
    }

    if (acceptsChildren) {
      const topZone = rect.top + rect.height * 0.25;
      const bottomZone = rect.bottom - rect.height * 0.25;
      if (e.clientY > topZone && e.clientY < bottomZone) {
        onDropTargetChange({ parentId: block.id, index: (block.children || []).length });
        return;
      }
    }

    const midY = rect.top + rect.height / 2;
    onDropTargetChange({ parentId, index: e.clientY < midY ? index : index + 1 });
  }, [isDragging, isSelfDragging, index, parentId, block.id, block.children, acceptsChildren, isHorizontal, inGrid, myCell, onDropTargetChange]);

  const handleDragStart = useCallback((e) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', block.id);
    requestAnimationFrame(() => onDragStartBlock?.(block.id));
  }, [block.id, onDragStartBlock]);

  const {
    fullWidth,
    borderSides,
    borderWidth,
    borderStyle,
    borderColor,
    link,
    linkTarget,
    colSpan,
    rowSpan,
    colStart,
    rowStart,
    ...rawRestStyle
  } = block.style || {};
  const restStyle = {};
  for (const k in rawRestStyle) {
    const v = rawRestStyle[k];
    if (v !== '' && v !== null && v !== undefined) restStyle[k] = v;
  }
  const gridSpanStyle = {};
  if (!gridLinear && !inStack) {
    let cs = Math.max(1, Number(colSpan) || 1);
    const rs = Number(rowSpan);
    let cStart = Number(colStart);
    let rStart = Number(rowStart);
    if (gridCols != null) {
      if (cStart > gridCols) { cStart = 0; rStart = 0; }
      if (cStart > 0 && cStart + cs - 1 > gridCols) cs = gridCols - cStart + 1;
      if (cStart === 0 && cs > gridCols) cs = gridCols;
      if (cStart === 0 && rStart > 0) rStart = 0;
    }
    if (cStart > 0) {
      gridSpanStyle.gridColumn = cs > 1 ? `${cStart} / span ${cs}` : `${cStart}`;
    } else if (cs > 1) {
      gridSpanStyle.gridColumn = `span ${cs}`;
    }
    if (rStart > 0) {
      gridSpanStyle.gridRow = rs > 1 ? `${rStart} / span ${rs}` : `${rStart}`;
    } else if (rs > 1) {
      gridSpanStyle.gridRow = `span ${rs}`;
    }
  }
  const borderCss = (() => {
    if (!borderStyle || borderStyle === 'none') return null;
    const raw = borderWidth == null || borderWidth === '' ? 1 : borderWidth;
    const widthCss =
      typeof raw === 'number'
        ? `${raw}px`
        : /^-?\d+(\.\d+)?$/.test(String(raw).trim())
        ? `${String(raw).trim()}px`
        : String(raw).trim();
    const decl = `${widthCss} ${borderStyle} ${borderColor || '#000000'}`;
    const sides = borderSides || 'all';
    if (sides === 'all') return { border: decl };
    const capitalized = sides.charAt(0).toUpperCase() + sides.slice(1);
    return { [`border${capitalized}`]: decl };
  })();
  const fullWidthStyle = fullWidth
    ? {
        width: 'var(--fbw, 100%)',
        maxWidth: 'none',
        marginLeft: 'calc(50% - var(--fbw, 100%) / 2)',
        marginRight: 'calc(50% - var(--fbw, 100%) / 2)',
      }
    : null;

  return (
    <>
      {showZones && <DropIndicator active={isBefore} />}
      <div
        data-block-id={block.id}
        draggable={isEditing && !inStack}
        onDragStart={isEditing && !inStack ? handleDragStart : undefined}
        onDragEnd={isEditing && !inStack ? onDragEndBlock : undefined}
        style={{
          position: 'relative',
          pointerEvents: isSelfDragging ? 'none' : 'auto',
          outline: getOutline(),
          outlineOffset: -1,
          cursor: isEditing ? (isDragging ? undefined : 'grab') : undefined,
          transition: 'outline-color 0.15s',
          opacity: isSelfDragging ? 0.3 : 1,
          minWidth: 0,
          ...(isEditing ? { overflowX: 'clip' } : null),
          minHeight: isEditing && acceptsChildren ? 32 : undefined,
          boxShadow:
            showSideZones && isBefore
              ? 'inset 3px 0 0 0 #0F4C5C'
              : showSideZones && isAfter
              ? 'inset -3px 0 0 0 #0F4C5C'
              : undefined,
          ...restStyle,
          ...(borderCss || {}),
          ...fullWidthStyle,
          ...gridSpanStyle,
          ...(restStyle.borderRadius && !restStyle.overflow
            ? { overflow: 'hidden' }
            : null),
        }}
        onClick={isEditing ? (e) => { e.preventDefault(); e.stopPropagation(); onSelect(block.id); } : undefined}
        onMouseEnter={isEditing ? () => setHovered(true) : undefined}
        onMouseLeave={isEditing ? () => setHovered(false) : undefined}
        onDragOver={handleDragOver}
      >
        {cellDropSide && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: -4,
              bottom: -4,
              [cellDropSide]: -3,
              width: 4,
              background: '#0F4C5C',
              borderRadius: 2,
              zIndex: 20,
              pointerEvents: 'none',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.85)',
            }}
          />
        )}
        {isEditing && !isDragging && (hovered || isSelected) && (
          <div style={{
            position: 'absolute', top: 0, left: 0,
            background: isSelected ? '#0F4C5C' : '#9A9A95',
            color: '#fff', fontSize: 10, fontWeight: 600,
            padding: '1px 6px', borderRadius: '0 0 4px 0',
            zIndex: 10, pointerEvents: 'none', lineHeight: '16px',
          }}>
            {block.component}
          </div>
        )}
        {isEditing && !isDragging && (hovered || isSelected) && (
          <span
            title="Drag to move"
            aria-label="Drag handle"
            style={{
              position: 'absolute', top: 0, right: 50,
              width: 22, height: 22,
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              color: '#525252',
              borderRadius: 4,
              cursor: 'grab', zIndex: 11,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              userSelect: 'none',
              pointerEvents: 'auto',
            }}
          >
            <IconGripVertical />
          </span>
        )}
        {isEditing && !isDragging && (hovered || isSelected) && onDuplicate && (
          <div
            style={{
              position: 'absolute', top: 0, right: 25, zIndex: 11,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <OverlayIconBtn
              title="Duplicate block"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDuplicate(block.id); }}
            >
              <IconCopy />
            </OverlayIconBtn>
          </div>
        )}
        {isEditing && !isDragging && (hovered || isSelected) && onDelete && (
          <div
            style={{
              position: 'absolute', top: 0, right: 0, zIndex: 11,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <OverlayIconBtn
              title="Delete block"
              intent="danger"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(block.id); }}
            >
              <IconX />
            </OverlayIconBtn>
          </div>
        )}
        {isEditing && !isDragging && (hovered || isSelected) && block.component === 'Grid' && onUpdateProp && (
          <GridSizeControls block={block} onUpdateProp={onUpdateProp} />
        )}
        {isInside && (
          <div style={{
            position: 'absolute', top: 2, right: 6,
            background: '#0F4C5C', color: '#fff', fontSize: 9, fontWeight: 600,
            padding: '1px 6px', borderRadius: 3, zIndex: 10, pointerEvents: 'none',
          }}>
            insert inside
          </div>
        )}
        {link ? (
          <a
            href={link}
            target={linkTarget || undefined}
            rel={linkTarget === '_blank' ? 'noopener noreferrer' : undefined}
            style={{
              display: 'block',
              width: '100%',
              color: 'inherit',
              textDecoration: 'inherit',
              pointerEvents: isEditing ? 'none' : 'auto',
            }}
          >
            {children}
          </a>
        ) : (
          <div style={isEditing
            ? { pointerEvents: 'none', width: '100%', height: '100%' }
            : { width: '100%', height: '100%' }}>
            {children}
          </div>
        )}
      </div>
      {showZones && index === totalCount - 1 && <DropIndicator active={isAfter} />}
    </>
  );
}
