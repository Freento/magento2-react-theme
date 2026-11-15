import { useState, useCallback, useRef, useContext } from 'react';
import { OverlayIconBtn, IconGripVertical, IconCopy, IconClipboard, IconClipboardPaste, IconScissors, IconX, useHoverTip } from '../overlay/icons.jsx';
import { BlockActionsMenu } from '../overlay/BlockActionsMenu.jsx';
import { hasCopiedBlock } from '../lib/blockClipboard.js';
import { GridSizeControls } from './GridSizeControls.jsx';
import registry from '../registry-runtime.js';
import { useIsoLayoutEffect } from '../lib/useIsoLayoutEffect.js';
import { gridSpanStyle as gridSpanFor } from '../lib/gridLayout.js';
import { InsideLinkContext } from '../link-context.js';
import { wrapperBorderCss } from '../lib/wrapperBorder.js';

const OVERLAY_ROOM = 26;
const OVERLAY_MIN_WIDTH = 130;

const LENGTH_KEYS = new Set(['width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight']);
const FULL_WIDTH_OVERRIDDEN = new Set(['width', 'minWidth', 'maxWidth', 'marginLeft', 'marginRight']);

export function BlockWrapper({ block, index, parentId, totalCount, onSelect, onDelete, onDuplicate, onCopy, onCut, onPaste, onUpdateProp, selectedId, hoveredId, isDragging, dropTarget, onDropTargetChange, editingTarget, onDragStartBlock, onDragEndBlock, validateDrop, isLocked, inGrid, horizontal, gridCols, myCell, inStack, stackLast, children }) {
  const isHorizontal = !inStack && (inGrid || horizontal);
  const rootRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [hoveredSelf, setHoveredSelf] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const leaveTimer = useRef(null);
  const holdHover = useCallback(() => {
    clearTimeout(leaveTimer.current);
    setHovered(true);
  }, []);
  const releaseHover = useCallback(() => {
    clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => setHovered(false), 150);
  }, []);
  const moveTip = useHoverTip('Drag to move');
  const handleMouseOver = useCallback((e) => {
    const self = e.target?.closest?.('[data-block-id]') === rootRef.current;
    setHoveredSelf(self);
    if (self) {
      holdHover();
    } else {
      clearTimeout(leaveTimer.current);
      setHovered(false);
    }
  }, [holdHover]);
  const handleMouseLeave = useCallback(() => {
    setHoveredSelf(false);
    releaseHover();
  }, [releaseHover]);

  // The block is draggable ONLY while grabbing the move handle (grip). The
  // wrapper renders draggable=false by default so clicking overlay controls (or
  // anywhere on the block) never starts a native drag that would swallow the
  // click. The grip arms draggable synchronously on mousedown (before the
  // browser decides to drag) and disarms on mouseup.
  const armDrag = useCallback((e) => {
    e.stopPropagation();
    const root = rootRef.current;
    if (!root) return;
    root.setAttribute('draggable', 'true');
    const disarm = () => {
      if (rootRef.current) rootRef.current.setAttribute('draggable', 'false');
      window.removeEventListener('mouseup', disarm, true);
    };
    window.addEventListener('mouseup', disarm, true);
  }, []);
  const isSelected = selectedId === block.id;
  const isTreeHovered = hoveredId === block.id;
  const isEditing = !!onSelect;
  const isSelfDragging = isDragging === block.id;
  const acceptsChildren = registry[block.component]?.acceptsChildren;
  const backgroundOnContent = !!registry[block.component]?.backgroundOnContent;
  // Locked blocks keep their settings and the move handle, but lose copy/delete.
  const locked = !!isLocked?.(block);
  const insideLink = useContext(InsideLinkContext);
  const hasGridSizing = block.component === 'Grid';
  const hasParent = isEditing && !!parentId && parentId !== 'root-page';
  const underSelected = !!selectedId && !isSelected && !!rootRef.current?.parentElement?.closest?.(`[data-block-id="${CSS.escape(String(selectedId))}"]`);
  const showControls = isEditing && !isDragging && (isSelected || menuOpen || (hovered && !underSelected));
  const [overlayFit, setOverlayFit] = useState({ roomAbove: true, compact: false });
  useIsoLayoutEffect(() => {
    if (!showControls) return undefined;
    const root = rootRef.current;
    if (!root) return undefined;
    let scroller = root.parentElement;
    while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
    const measure = () => {
      const rect = root.getBoundingClientRect();
      let limit = scroller ? scroller.getBoundingClientRect().top : 0;
      if (scroller) {
        for (const el of scroller.children) {
          if (getComputedStyle(el).position === 'sticky') limit = Math.max(limit, el.getBoundingClientRect().bottom);
        }
        for (const el of scroller.querySelectorAll('header')) {
          if (el.contains(root)) continue;
          const hr = el.getBoundingClientRect();
          if (hr.bottom <= rect.top + 1 && hr.bottom > rect.top - OVERLAY_ROOM) limit = Math.max(limit, hr.bottom);
        }
      }
      const next = {
        roomAbove: rect.top - limit >= OVERLAY_ROOM,
        compact: rect.width < OVERLAY_MIN_WIDTH || rect.height < OVERLAY_ROOM,
      };
      setOverlayFit((prev) => (prev.roomAbove === next.roomAbove && prev.compact === next.compact ? prev : next));
    };
    measure();
    const target = scroller || window;
    target.addEventListener('scroll', measure, { passive: true });
    return () => target.removeEventListener('scroll', measure);
  }, [showControls]);
  const compact = overlayFit.compact;
  const overlayAnchor = (acceptsChildren || compact)
    ? (overlayFit.roomAbove ? { bottom: '100%', marginBottom: 7 } : compact ? { top: '100%', marginTop: 1 } : { top: 1 })
    : { top: 1 };

  const notSelf = isDragging !== block.id;
  const showZones = isDragging && notSelf && !isHorizontal;
  const showSideZones = isDragging && notSelf && isHorizontal;

  const isBefore = (showZones || showSideZones) && dropTarget?.parentId === parentId && dropTarget?.index === index;
  const isAfter = (showZones || showSideZones) && dropTarget?.parentId === parentId && dropTarget?.index === index + 1 && (index === totalCount - 1 || stackLast);
  const isInside = (showZones || showSideZones) && dropTarget?.parentId === block.id;
  const isEmptyContainer = !!onSelect && acceptsChildren && (block.children?.length || 0) === 0;

  const isCellDropTarget =
    isDragging === 'cell' &&
    inGrid &&
    myCell &&
    dropTarget?.parentId === parentId &&
    dropTarget?.cell?.r === myCell.r &&
    dropTarget?.cell?.c === myCell.c;

  const getFrame = () => {
    if (isInside) return { width: 2, style: 'solid', color: '#0F4C5C' };
    if (isSelected) return { width: 2, style: 'solid', color: '#0F4C5C' };
    if (isTreeHovered) return { width: 2, style: 'solid', color: '#6F6F6B' };
    if (hoveredSelf && !isDragging) return { width: 2, style: 'dashed', color: '#6F6F6B' };
    if (isEmptyContainer) return { width: 1, style: 'dashed', color: '#9E9E99' };
    return null;
  };
  const frame = getFrame();
  const cellDropSide = isCellDropTarget ? dropTarget?.side : null;
  const sideHint = showSideZones && dropTarget?.hintId === block.id ? dropTarget.hintSide : null;

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (isSelfDragging || !isDragging) {
      e.stopPropagation();
      return;
    }

    // Tag every drop target with its region so root-level drops land in the
    // right global block (page / footer / menu) instead of falling back to it.
    const emit = (dt) => {
      if (validateDrop && !validateDrop(dt.parentId)) return;
      e.stopPropagation();
      const next = { ...dt, target: editingTarget };
      const cur = dropTarget;
      if (
        cur &&
        cur.parentId === next.parentId &&
        cur.index === next.index &&
        cur.target === next.target &&
        cur.side === next.side &&
        cur.hintId === next.hintId &&
        cur.hintSide === next.hintSide &&
        cur.cell?.r === next.cell?.r &&
        cur.cell?.c === next.cell?.c
      ) return;
      onDropTargetChange(next);
    };

    const rect = e.currentTarget.getBoundingClientRect();
    if (isDragging === 'cell' && inGrid && myCell) {
      const sideC = (e.clientX - rect.left) < rect.width / 2 ? 'left' : 'right';
      emit({ parentId, index: 0, cell: { r: myCell.r, c: myCell.c }, side: sideC });
      return;
    }
    const apart = (a, b) => a.top >= b.bottom - 1 || a.bottom <= b.top + 1;
    const siblingRects = [...(e.currentTarget.parentElement?.querySelectorAll(':scope > [data-block-id], :scope > [data-cell-stack]') || [])]
      .filter((el) => el !== e.currentTarget)
      .map((el) => el.getBoundingClientRect());
    const stacked = isHorizontal && siblingRects.every((r) => apart(rect, r));
    if (block.component === 'Grid') {
      const edge = 32;
      if (e.clientY < rect.top + edge) {
        emit({ parentId, index, hintId: block.id, hintSide: stacked ? 'top' : 'left' });
        return;
      }
      if (e.clientY > rect.bottom - edge) {
        emit({ parentId, index: index + 1, hintId: block.id, hintSide: stacked ? 'bottom' : 'right' });
        return;
      }
      const root = e.currentTarget;
      const kids = (block.children || []);
      let nearest = null;
      const kidRects = [];
      for (const el of root.querySelectorAll('[data-block-id]')) {
        if (el.parentElement?.closest('[data-block-id]') !== root) continue;
        const r = el.getBoundingClientRect();
        kidRects.push(r);
        const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
        const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
        const d = dx * dx + dy * dy;
        if (!nearest || d < nearest.d) nearest = { el, r, d };
      }
      const nearIndex = nearest ? kids.findIndex((k) => k.id === nearest.el.dataset.blockId) : -1;
      if (nearIndex < 0) {
        emit({ parentId: block.id, index: kids.length });
        return;
      }
      const nearStacked = kidRects.every((r) => r === nearest.r || apart(nearest.r, r));
      const after = nearStacked
        ? e.clientY > nearest.r.top + nearest.r.height / 2
        : e.clientX > nearest.r.left + nearest.r.width / 2;
      const hintSide = nearStacked ? (after ? 'bottom' : 'top') : (after ? 'right' : 'left');
      emit({ parentId: block.id, index: after ? nearIndex + 1 : nearIndex, hintId: nearest.el.dataset.blockId, hintSide });
      return;
    }

    if (isHorizontal) {
      const pos = stacked ? e.clientY - rect.top : e.clientX - rect.left;
      const size = stacked ? rect.height : rect.width;
      const beforeSide = stacked ? 'top' : 'left';
      const afterSide = stacked ? 'bottom' : 'right';
      if (pos < size * 0.3) {
        emit({ parentId, index, hintId: block.id, hintSide: beforeSide });
        return;
      }
      if (pos > size * 0.7) {
        emit({ parentId, index: index + 1, hintId: block.id, hintSide: afterSide });
        return;
      }
      if (acceptsChildren) {
        emit({ parentId: block.id, index: (block.children || []).length });
        return;
      }
      emit({ parentId, index: index + 1, hintId: block.id, hintSide: afterSide });
      return;
    }

    if (acceptsChildren) {
      const topZone = rect.top + rect.height * 0.25;
      const bottomZone = rect.bottom - rect.height * 0.25;
      if (e.clientY > topZone && e.clientY < bottomZone) {
        emit({ parentId: block.id, index: (block.children || []).length });
        return;
      }
    }

    const midY = rect.top + rect.height / 2;
    emit({
      parentId,
      index: e.clientY < midY ? index : index + 1,
      ...(inStack && myCell ? { cell: myCell } : {}),
    });
  }, [isDragging, isSelfDragging, index, parentId, block.id, block.children, acceptsChildren, isHorizontal, inGrid, inStack, myCell, dropTarget, onDropTargetChange, editingTarget, validateDrop]);

  const handleDragStart = useCallback((e) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', block.id);
    requestAnimationFrame(() => {
      clearTimeout(leaveTimer.current);
      setHovered(false);
      onDragStartBlock?.(block.id);
    });
  }, [block.id, onDragStartBlock]);

  const {
    fullWidth,
    borderSides,
    borderWidth,
    borderStyle,
    borderColor,
    link,
    linkTarget,
    backgroundImage,
    backgroundSize,
    backgroundPosition,
    backgroundOverlay,
    colStart,
    rowStart,
    hidden,
    ...rawRestStyle
  } = block.style || {};
  // `hidden` is resolved per device, so it is already true only for the screen
  // being rendered. On the storefront the block is dropped from the layout; in
  // the editor it must stay visible and selectable — otherwise the author could
  // never get it back — so it is only dimmed.
  const hiddenStyle = hidden
    ? (isEditing ? { opacity: 0.35, filter: 'grayscale(1)' } : { display: 'none' })
    : null;
  const restStyle = {};
  for (const k in rawRestStyle) {
    const v = rawRestStyle[k];
    if (v === '' || v === null || v === undefined) continue;
    // Full-bleed is done by `.ec-fullwidth`; an inline width or side margin
    // would win over the class and leave the block narrow but shifted off the
    // left edge, so a stretched block drops them while the option is on.
    if (fullWidth && FULL_WIDTH_OVERRIDDEN.has(k)) continue;
    if (backgroundOnContent && k === 'backgroundColor') continue;
    restStyle[k] = LENGTH_KEYS.has(k) && /^-?\d*\.?\d+$/.test(String(v).trim()) ? `${String(v).trim()}px` : v;
  }
  const gridSpanStyle = inStack ? {} : gridSpanFor({ colStart, rowStart }, gridCols);
  const clipRounded = !!restStyle.borderRadius && !restStyle.overflow;
  const asLink = link && !insideLink;
  const backgroundCss = (() => {
    const scrim = Number(backgroundOverlay) || 0;
    const layers = [];
    if (scrim > 0) layers.push(`linear-gradient(rgba(0,0,0,${scrim}), rgba(0,0,0,${scrim}))`);
    if (backgroundImage) layers.push(`url("${backgroundImage}")`);
    if (!layers.length) return null;
    const size = backgroundSize || 'cover';
    const pos = backgroundPosition || 'center center';
    return {
      backgroundImage: layers.join(', '),
      backgroundSize: layers.length > 1 ? `auto, ${size}` : size,
      backgroundPosition: layers.length > 1 ? `center, ${pos}` : pos,
      backgroundRepeat: 'no-repeat',
    };
  })();
  const borderCss = wrapperBorderCss({ borderSides, borderWidth, borderStyle, borderColor });
  return (
    <>
      <div
        ref={rootRef}
        data-block-id={block.id}
        className={fullWidth ? 'ec-fullwidth' : undefined}
        draggable={false}
        onDragStart={isEditing ? handleDragStart : undefined}
        onDragEnd={isEditing ? (e) => { rootRef.current?.setAttribute('draggable', 'false'); onDragEndBlock?.(e); } : undefined}
        style={{
          position: 'relative',
          pointerEvents: isSelfDragging ? 'none' : 'auto',
          cursor: isEditing ? (isDragging ? undefined : 'grab') : undefined,
          opacity: isSelfDragging ? 0.3 : 1,
          minWidth: 0,
          minHeight: isEditing && acceptsChildren ? 32 : undefined,
          ...restStyle,
          ...(backgroundCss || {}),
          ...(borderCss || {}),
          ...gridSpanStyle,
          ...(isEditing && (isInside || isSelected)
            ? { zIndex: 6 }
            : isEditing && (isTreeHovered || (hoveredSelf && !isDragging))
            ? { zIndex: 5 }
            : null),
          ...(restStyle.borderRadius && !restStyle.overflow && !isEditing
            ? { overflow: 'hidden' }
            : null),
          // Last, so nothing authored can override the hidden state.
          ...hiddenStyle,
        }}
        onClick={isEditing ? (e) => { e.preventDefault(); e.stopPropagation(); onSelect(block.id); } : undefined}
        onMouseOver={isEditing ? handleMouseOver : undefined}
        onMouseLeave={isEditing ? handleMouseLeave : undefined}
        onDragOver={handleDragOver}
      >
        {frame && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              outline: `${frame.width}px ${frame.style} ${frame.color}`,
              outlineOffset: -1,
              borderRadius: restStyle.borderRadius || undefined,
              pointerEvents: 'none',
              zIndex: 9,
            }}
          />
        )}
        {cellDropSide && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              [cellDropSide]: 0,
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
          <div
            data-overlay-row=""
            style={{
              position: 'absolute', ...overlayAnchor, left: 1, right: compact ? 'auto' : 1,
              display: 'flex', alignItems: 'flex-start', gap: 3,
              zIndex: 11, pointerEvents: 'none', whiteSpace: 'nowrap',
            }}
          >
            <div
              title={hasParent ? 'Select the parent block' : undefined}
              onMouseDown={hasParent ? (e) => e.stopPropagation() : undefined}
              onClick={hasParent ? (e) => { e.preventDefault(); e.stopPropagation(); onSelect(parentId); } : undefined}
              style={{
                background: isSelected ? '#0F4C5C' : '#6F6F6B',
                color: '#fff', fontSize: 10, fontWeight: 600,
                padding: '1px 6px', borderRadius: '0 0 4px 0',
                lineHeight: '16px', marginRight: 'auto',
                pointerEvents: hasParent ? 'auto' : 'none',
                cursor: hasParent ? 'pointer' : 'default',
              }}
            >
              {block.component}
            </div>
            {!locked && (
              <BlockActionsMenu
                onOpenChange={setMenuOpen}
                items={[
                  onCopy && { label: 'Copy', icon: <IconClipboard />, shortcut: 'C', onClick: () => onCopy(block.id) },
                  onCut && { label: 'Cut', icon: <IconScissors />, shortcut: 'X', onClick: () => onCut(block.id) },
                  onPaste && menuOpen && hasCopiedBlock() && { label: 'Paste', icon: <IconClipboardPaste />, shortcut: 'V', onClick: () => onPaste(block.id) },
                  onDuplicate && { label: 'Duplicate', icon: <IconCopy />, onClick: () => onDuplicate(block.id) },
                ].filter(Boolean)}
              />
            )}
            <span
              ref={moveTip.ref}
              aria-label="Drag to move"
              onMouseDown={armDrag}
              {...moveTip.hoverProps}
              style={{
                width: 22, height: 22,
                background: '#ffffff',
                border: '1px solid #B9B9B4',
                color: '#424242',
                borderRadius: 4,
                cursor: 'grab',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                userSelect: 'none',
                pointerEvents: 'auto',
                boxSizing: 'border-box',
              }}
            >
              <IconGripVertical />
              {moveTip.tip}
            </span>
            {onDelete && !locked && (
              <div style={{ pointerEvents: 'auto' }} onMouseDown={(e) => e.stopPropagation()}>
                <OverlayIconBtn
                  title="Delete block"
                  intent="danger"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(block.id); }}
                >
                  <IconX />
                </OverlayIconBtn>
              </div>
            )}
          </div>
        )}
        {showControls && hasGridSizing && onUpdateProp && (
          <GridSizeControls block={block} onUpdateProp={onUpdateProp} anchorRef={rootRef} onEnter={holdHover} onLeave={releaseHover} />
        )}
        {(isHorizontal ? !!sideHint : (isBefore || isAfter)) && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              background: '#0F4C5C',
              borderRadius: 2,
              zIndex: 20,
              boxShadow: '0 0 0 1px rgba(255,255,255,0.85)',
              pointerEvents: 'none',
              ...(isHorizontal
                ? (sideHint === 'left' || sideHint === 'right'
                  ? { top: 0, bottom: 0, [sideHint]: 0, width: 4 }
                  : { left: 0, right: 0, [sideHint]: 0, height: 4 })
                : { left: 0, right: 0, [isBefore ? 'top' : 'bottom']: 0, height: 4 }),
            }}
          />
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
        {asLink ? (
          <a
            data-block-content=""
            href={link}
            target={linkTarget || undefined}
            rel={linkTarget === '_blank' ? 'noopener noreferrer' : undefined}
            style={{
              display: 'block',
              width: '100%',
              color: 'inherit',
              textDecoration: 'inherit',
              pointerEvents: isEditing ? 'none' : 'auto',
              ...(isEditing ? { overflowX: 'clip' } : null),
              ...(isEditing && clipRounded ? { overflow: 'hidden', borderRadius: 'inherit' } : null),
            }}
          >
            <InsideLinkContext.Provider value={true}>{children}</InsideLinkContext.Provider>
          </a>
        ) : (
          <div data-block-content="" style={isEditing
            ? { pointerEvents: 'none', width: '100%', height: '100%', overflowX: 'clip', ...(clipRounded ? { overflow: 'hidden', borderRadius: 'inherit' } : null) }
            : { width: '100%', height: '100%' }}>
            {children}
          </div>
        )}
      </div>
    </>
  );
}
