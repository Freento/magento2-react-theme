import { useState, useEffect, useRef, useCallback } from 'react';
import { renderPage, renderPageBlocks, useActiveDevices } from 'editor-core/renderer';
import PreviewChrome from '../../src/editor/PreviewChrome.jsx';
import RoutePreview from '../../src/editor/RoutePreview.jsx';
// Share the editor's block registry instead of keeping a second copy here: the
// preview frame renders the very same page, so a widget added for the editor
// (AR-14579 Products List) must not fall through to "Unknown: <component>" the
// moment the user switches to tablet/mobile, which is what swaps this frame in.
import { allBlocks } from '../editor/lib/hostBlocks.jsx';
import { PAGE_AREA, BARE_PAGE_PATHS, areaByKey, areaMap } from '../editor/lib/areas.js';
import { useBlockTreeAccess } from '../editor/hooks/useBlockTreeAccess.js';
import { useDragState } from '../editor/hooks/useDragState.js';
import { holdsSystemBlock } from '../editor/lib/blockTree.js';

const post = (msg) => {
  try {
    window.parent?.postMessage(msg, '*');
  } catch {}
};

export default function PreviewFramePage() {
  // The editor posts the whole area map (page + global blocks) in one message.
  const [areas, setAreas] = useState(() => areaMap(null));
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const devices = useActiveDevices();
  const pageData = areas[PAGE_AREA];

  const { findBlockById, isDropAllowed } = useBlockTreeAccess({
    areas,
    setArea: () => {},
    selectedBlockId: selectedId,
    device: 'desktop',
  });
  const {
    dragType, dragData, dropTarget,
    setDragType, setDragData, setDropTarget,
    isDraggingValue, draggedComponent,
    handlePreviewDragStart, handlePreviewCellDragStart, handleDragEnd,
  } = useDragState({ findBlockById });

  const dragRef = useRef({});
  const externalRef = useRef(false);
  dragRef.current = { dragType, dragData, dropTarget, handleDragEnd };

  useEffect(() => {
    const onMessage = (e) => {
      const msg = e.data;
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'pageData') {
        setAreas(msg.areas || areaMap(null));
        if ('selectedId' in msg) setSelectedId(msg.selectedId);
        if ('hoveredId' in msg) setHoveredId(msg.hoveredId);
        if ('activeItem' in msg) setActiveItem(msg.activeItem);
      } else if (msg.type === 'dragState') {
        setDragType(msg.dragType || null);
        setDragData(msg.dragType ? msg.dragData : null);
        externalRef.current = !!msg.external;
        if (!msg.dragType) setDropTarget(null);
      }
    };
    window.addEventListener('message', onMessage);
    post({ type: 'frame-ready' });
    return () => window.removeEventListener('message', onMessage);
  }, [setDragType, setDragData, setDropTarget]);

  useEffect(() => {
    const onDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = dragRef.current.dragType === 'new' ? 'copy' : 'move';
    };
    const onDrop = (e) => {
      e.preventDefault();
      const { dragType, dragData, dropTarget, handleDragEnd } = dragRef.current;
      const external = externalRef.current;
      if (dragType) post({
        type: 'drop',
        drop: {
          dragType, dragData, dropTarget, external,
          ...(external ? { file: e.dataTransfer.files?.[0] || null, text: e.dataTransfer.getData('text/plain') } : {}),
        },
      });
      handleDragEnd();
    };
    const onDragLeave = () => setDropTarget(null);
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('dragleave', onDragLeave);
    document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('dragleave', onDragLeave);
      document.removeEventListener('drop', onDrop);
    };
  }, [setDropTarget]);

  const validateDrop = useCallback(
    (target, targetArea) => {
      if (!draggedComponent) return true;
      const parentId = target && typeof target === 'object' ? target.parentId : target;
      return isDropAllowed(draggedComponent, parentId, dragType === 'reorder' ? dragData : null, targetArea);
    },
    [draggedComponent, isDropAllowed, dragType, dragData]
  );

  // Every interaction is relayed to the editor, which owns the state.
  const relay = (type) => (id, key, value) => {
    if (type === 'select') setSelectedId(id);
    post({ type, id, key, value });
  };
  const handleSelect = relay('select');
  const handleDelete = relay('delete');
  const handleDuplicate = relay('duplicate');
  const handleCopy = relay('copy');
  const handleCut = relay('cut');
  const handlePaste = relay('paste');
  const handleUpdateProp = relay('updateProp');
  const handleCellDelete = (payload) => post({ type: 'cellDelete', payload });
  const handleCellDuplicate = (payload) => post({ type: 'cellDuplicate', payload });

  // Same option set for every region, and the same `contained` rule the editor
  // and the storefront use, so the frame can't drift from them.
  const renderOptions = (key) => ({
      onSelect: handleSelect,
      onDelete: handleDelete,
      onDuplicate: handleDuplicate,
      onCopy: handleCopy,
      onCut: handleCut,
      onPaste: handlePaste,
      onUpdateProp: handleUpdateProp,
      selectedId,
      hoveredId,
      activeItem,
      isDragging: isDraggingValue,
      dropTarget,
      onDropTargetChange: setDropTarget,
      validateDrop: (target) => validateDrop(target, key),
      isLocked: holdsSystemBlock,
      onDragStartBlock: handlePreviewDragStart,
      onCellDragStart: handlePreviewCellDragStart,
      onCellDelete: handleCellDelete,
      onCellDuplicate: handleCellDuplicate,
      onDragEndBlock: handleDragEnd,
      devices,
      blocks: allBlocks,
      editingTarget: key,
  });

  const renderArea = (key) => {
    const value = areas[key];
    if (!value) return null;
    const render = areaByKey(key).contained ? renderPage : renderPageBlocks;
    return render(value, renderOptions(key));
  };

  if (!pageData) {
    return (
      <div style={{ padding: 40, color: '#424242', textAlign: 'center', fontSize: 13 }}>
        Loading preview…
      </div>
    );
  }

  if (BARE_PAGE_PATHS.includes(pageData?.path)) return <main>{renderArea(PAGE_AREA)}</main>;

  return (
    <PreviewChrome
      pagePath={pageData?.path}
      footerContent={renderArea('footer')}
      menuContent={renderArea('menu')}
      menuData={areas.menu}
    >
      <main>
        {pageData.route
          ? <RoutePreview doc={pageData}>{renderPageBlocks(pageData, renderOptions(PAGE_AREA))}</RoutePreview>
          : renderArea(PAGE_AREA)}
      </main>
    </PreviewChrome>
  );
}
