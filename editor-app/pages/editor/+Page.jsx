import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import registry from 'editor-core/registry';
import { renderPage, renderPageBlocks } from 'editor-core/renderer';
import { UI } from '../../src/editor/Icon.jsx';
import PreviewChrome from '../../src/editor/PreviewChrome.jsx';
import RoutePreview from '../../src/editor/RoutePreview.jsx';
import MobileUnavailable, { useEditorUnavailable } from '../../src/editor/MobileUnavailable.jsx';
import { installSessionFetch, SessionLoginModal } from '../../src/editor/editorSession.jsx';
import '../../src/styles/editor.css';

import { allBlocks, deviceChain } from './lib/hostBlocks.jsx';
import { collectFrequentColors } from './lib/color.js';
import { PageSelect } from './fields/PageSelect.jsx';
import { PreviewPanel } from './preview/PreviewPanel.jsx';
import { Inspector } from './Inspector.jsx';
import { RouteSettings } from './RouteSettings.jsx';
import { resolveRoute } from './lib/resolveRoute.js';
import { areasForDoc, isRouteId, toRouteId, viewOfArea, foldArea } from './lib/docView.js';
import { BlockTree } from './BlockTree.jsx';
import { CatalogPanel } from './CatalogPanel.jsx';
import { AREAS, PAGE_AREA, GLOBAL_AREAS, isBarePage, areaByKey } from './lib/areas.js';
import { holdsSystemBlock, findBlockLocation } from './lib/blockTree.js';
import { useToast } from './hooks/useToast.js';
import { iconBtn, emptyState } from './lib/cls.js';
import { useBuildVersion } from './hooks/useBuildVersion.js';
import { useSavePush } from './hooks/useSavePush.js';
import { useAreas } from './hooks/useAreas.js';
import { usePageActions } from './hooks/usePageActions.js';
import { ConfirmModal } from './ConfirmModal.jsx';
import { useDragDrop } from './hooks/useDragDrop.js';
import { useBlockActions } from './hooks/useBlockActions.js';
import { TooltipLayer } from './TooltipLayer.jsx';
import { setLinkTargets, setLinkSearch } from 'editor-core/lib/linkTargets';
import { searchStoreLinks } from './lib/linkSearch.js';


export default function EditorPage() {
  installSessionFetch();
  const unavailable = useEditorUnavailable();
  if (unavailable) return <MobileUnavailable />;
  return (
    <>
      <EditorPageInner />
      <SessionLoginModal />
    </>
  );
}

function EditorPageInner() {
  const [currentPageId, setCurrentPageId] = useState('home');
  const { areas, setArea, markSaved, applyPageMeta, dirty, isDirty, undo, redo, canUndo, canRedo } =
    useAreas({ currentPageId });

  // The page area holds a stored document: a page as it is, or a route document
  // with one block list per area. The editing hooks only ever see a page-shaped
  // view of it, so a route document is projected into the area being edited and
  // every write is folded back.
  const doc = areas[PAGE_AREA];
  const editingRoute = isRouteId(currentPageId);
  const routeAreas = editingRoute ? areasForDoc(doc) : [];
  const [activeArea, setActiveArea] = useState(null);
  useEffect(() => {
    if (!editingRoute || !doc) return;
    const ids = areasForDoc(doc).map((a) => a.id);
    if (!ids.includes(activeArea)) setActiveArea(ids[0] || null);
  }, [editingRoute, doc, activeArea]);

  const projectionRef = useRef({ editingRoute: false, activeArea: null });
  projectionRef.current = { editingRoute, activeArea };

  const editAreas = useMemo(
    () => (editingRoute ? { ...areas, [PAGE_AREA]: viewOfArea(doc, activeArea) } : areas),
    [areas, doc, editingRoute, activeArea],
  );
  const editSetArea = useCallback((key, next) => {
    const { editingRoute: isRoute, activeArea: area } = projectionRef.current;
    if (key !== PAGE_AREA || !isRoute) return setArea(key, next);
    setArea(PAGE_AREA, (prev) => {
      if (!prev) return prev;
      const view = viewOfArea(prev, area);
      const updated = typeof next === 'function' ? next(view) : next;
      return foldArea(prev, area, updated);
    });
  }, [setArea]);

  const pageData = editAreas[PAGE_AREA];
  const barePage = isBarePage(doc);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [activeTab, setActiveTab] = useState('blocks');
  const [openAccordion, setOpenAccordion] = useState(null);
  const [listDrag, setListDrag] = useState({ key: null, fromIdx: null, overIdx: null, side: 'before' });
  const activeItem = useMemo(() => {
    const m = /^(.+)-(\d+)$/.exec(openAccordion || '');
    return m ? { key: m[1], index: Number(m[2]) } : null;
  }, [openAccordion]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [device, setDevice] = useState('desktop');
  const [hoveredTreeId, setHoveredTreeId] = useState(null);
  const devices = deviceChain(device);

  const frequentColors = useMemo(
    () => collectFrequentColors(pageData),
    [pageData]
  );

  const { buildOutdated } = useBuildVersion(isDirty);

  useEffect(() => {
    if (!isDirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  const { toast, showToast, dismissToast } = useToast();
  const { isSaving, saveRun, canPush, pushPreview, pendingLabels, save, refreshPushStatus, saveDisabled, saveTooltip } = useSavePush({
    currentPageId, areas, dirty, markSaved, showToast,
  });

  const wouldDiscard = useCallback(
    (id) => dirty[PAGE_AREA] || AREAS.some((a) => a.pageId === id && dirty[a.key]),
    [dirty]
  );

  const {
    pages, refreshPages, requestPageChange, pendingSwitchId, cancelPageChange, confirmPageChange,
    createPage, updatePage, duplicatePage, togglePageHidden,
    requestPageDelete, pendingDelete, cancelDelete, confirmDelete,
  } = usePageActions({
    currentPageId, setCurrentPageId, wouldDiscard,
    applyPageMeta, showToast, refreshPushStatus,
  });

  useEffect(() => {
    setLinkSearch(searchStoreLinks);
    return () => setLinkSearch(null);
  }, []);

  useEffect(() => {
    setLinkTargets((pages || []).filter((p) => p.path && !p.path.startsWith('/__')).map((p) => ({ title: p.title, path: p.path })));
  }, [pages]);
  const pendingSwitchPage = pages.find((p) => p.id === pendingSwitchId) || null;

  const openRouteByUrl = useCallback(async (input) => {
    const resolved = await resolveRoute(input);
    if (resolved.error) return { error: resolved.error };

    const existing = pages.find((p) => p.kind === 'route' && p.path === resolved.path);
    if (existing) {
      requestPageChange(existing.id);
      return { ok: true };
    }

    const res = await fetch('/api/editor/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: resolved.title,
        path: resolved.path,
        route: { type: resolved.type, id: resolved.id },
      }),
    });
    const created = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (created.id) {
        await refreshPages();
        requestPageChange(toRouteId(created.id));
        return { ok: true };
      }
      return { error: created.error || 'Could not create the document' };
    }
    await refreshPages();
    requestPageChange(toRouteId(created.id));
    return { ok: true };
  }, [pages, refreshPages, requestPageChange]);

  const changeArea = useCallback((id) => {
    setSelectedBlockId(null);
    setActiveArea(id);
  }, []);

  const setDisplayMode = useCallback((mode) => {
    setArea(PAGE_AREA, (prev) => (prev ? { ...prev, display: mode } : prev));
  }, [setArea]);

  const {
    activeTarget, sideForBlockId, findBlockById, getBlocksFor, setBlocksFor, isDropAllowed,
    handleSelect, addBlock, deleteBlock, duplicateBlock, copyBlock, cutBlock, pasteBlock, writeField,
    updateBlockProp, updateBlockStyle, patchBlockStyle, hasOverride, resetOverride,
    selectedBlock, selectedRegistry, selectedInsideLink,
  } = useBlockActions({
    areas: editAreas, setArea: editSetArea, selectedBlockId, setSelectedBlockId, setActiveTab, device, showToast,
  });

  const focusGlobalBlock = useCallback((id) => {
    const area = GLOBAL_AREAS.find((a) => a.pageId === id);
    if (!area) return;
    const first = areas[area.key]?.blocks?.[0]?.id;
    if (first) handleSelect(first);
    let attempts = 0;
    const tryScroll = () => {
      const el = document.querySelector(`[data-global-block="${id}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else if (++attempts < 10) requestAnimationFrame(tryScroll);
    };
    requestAnimationFrame(tryScroll);
  }, [areas, handleSelect]);

  const {
    dragType, dragData, dropTarget, treeDropTarget,
    setDragType, setDragData, setDropTarget, setTreeDropTarget,
    isDraggingValue, draggedComponent, validateDrop,
    handleCatalogDragStart, handleTreeDragStart, handlePreviewDragStart, handlePreviewCellDragStart, startFileDrag, externalDrag,
    handleCellDelete, handleCellDuplicate, handleDragEnd, handleTreeDragOver, handleTreeDrop, handleDrop, applyDrop,
  } = useDragDrop({ findBlockById, isDropAllowed, sideForBlockId, activeTarget, getBlocksFor, setBlocksFor, setSelectedBlockId, setActiveTab, showToast });

  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
      const key = { KeyC: 'c', KeyX: 'x', KeyV: 'v' }[e.code] || e.key.toLowerCase();
      if (key !== 'c' && key !== 'x' && key !== 'v') return;
      const t = e.target;
      if (t && (t.closest?.('input, textarea, select, [contenteditable="true"]') || t.isContentEditable)) return;
      if (typeof document !== 'undefined' && document.getSelection?.()?.toString()) return;
      if (key === 'c') { if (copyBlock()) e.preventDefault(); }
      else if (key === 'x') { if (cutBlock()) e.preventDefault(); }
      else if (pasteBlock()) e.preventDefault();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [copyBlock, cutBlock, pasteBlock]);

  const [openGroups, setOpenGroups] = useState({});
  const [treeExpanded, setTreeExpanded] = useState(() => new Set());
  useEffect(() => {
    if (!selectedRegistry) return;
    const firstGroup = (() => {
      for (const [, s] of Object.entries(selectedRegistry.propsSchema)) {
        if (s.group) return s.group;
      }
      return 'Advanced';
    })();
    setOpenGroups({ [firstGroup]: true });
  }, [selectedBlockId, selectedRegistry]);
  const toggleGroup = (name) =>
    setOpenGroups((prev) => ({ ...prev, [name]: !prev[name] }));

  const renderOptions = (key) => ({
    blocks: allBlocks,
    onSelect: handleSelect,
    onDelete: deleteBlock,
    onDuplicate: duplicateBlock,
    onCopy: copyBlock,
    onCut: cutBlock,
    onPaste: pasteBlock,
    onUpdateProp: updateBlockProp,
    selectedId: selectedBlockId,
    hoveredId: hoveredTreeId,
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
    editingTarget: key,
    devices,
  });

  const renderArea = (key) => {
    const value = editAreas[key];
    if (!value) return null;
    const render = areaByKey(key).contained ? renderPage : renderPageBlocks;
    return render(value, renderOptions(key));
  };

  const renderPageArea = () => (editingRoute
    ? <RoutePreview doc={pageData}>{renderPageBlocks(pageData, renderOptions(PAGE_AREA))}</RoutePreview>
    : renderArea(PAGE_AREA));

  if (!pageData) {
    return (
      <div className="editor-root">
        <div className={emptyState} style={{ padding: 60 }}>Loading...</div>
      </div>
    );
  }

  const categories = {
    layout: { label: 'Layout', items: [] },
    content: { label: 'Content', items: [] },
    domain: { label: 'Components', items: [] },
  };
  Object.entries(registry).forEach(([name, reg]) => {
    if (!reg.system && !reg.deprecated && !(reg.requiresBackend && barePage)) categories[reg.category]?.items.push({ name, ...reg });
  });

  const tabs = [
    { id: 'blocks', label: 'Blocks' },
    { id: 'tree', label: 'Tree' },
    { id: 'settings', label: 'Settings' },
  ];

  const treeSections = AREAS
    .filter((area) => !barePage || area.key === PAGE_AREA)
    .map((area) => ({
      key: area.key,
      label: area.key === PAGE_AREA && editingRoute
        ? routeAreas.find((a) => a.id === activeArea)?.label || 'Area'
        : area.label,
      blocks: editAreas[area.key]?.blocks || [],
    }));

  return (
    <div className="editor-root">
      <TooltipLayer />
      {buildOutdated && (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: 12, right: 12, zIndex: 2000,
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px',
            background: '#0F4C5C',
            color: '#fff',
            borderRadius: 8,
            boxShadow: '0 6px 16px rgba(15, 23, 42, 0.25)',
            fontSize: 13,
            fontFamily: 'inherit',
          }}
        >
          <span>
            Editor was updated.
            {isDirty ? ' Save your changes first, then reload to pick up the new version.' : ' Reload to pick up the new version.'}
          </span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '6px 12px',
              background: '#fff',
              color: '#0F4C5C',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Reload
          </button>
        </div>
      )}
      {toast && (
        <div
          role="status"
          className={[
            `editor-toast editor-toast--${toast.type}`,
            'fixed top-3 right-3 z-[2000] max-w-[520px] px-3.5 py-2.5 text-white rounded-xl text-[13px]',
            '[font-family:inherit] leading-[1.45] shadow-[0_6px_16px_rgba(15,23,42,0.25)] cursor-pointer',
            'whitespace-pre-wrap animate-[editor-toast-in_160ms_ease-out]',
            { success: 'bg-ed-success', error: 'bg-ed-danger', info: 'bg-ed-info' }[toast.type] || 'bg-ed-info',
          ].join(' ')}
          onClick={() => dismissToast()}
        >
          {toast.message}
        </div>
      )}
      <div className="editor flex h-screen bg-ed-bg">
        {sidebarCollapsed && (
          <button
            className="editor-expand absolute top-3 left-3 z-10 w-8 h-8 inline-flex items-center justify-center border border-solid border-ed-border bg-ed-surface rounded text-ed-text-muted cursor-pointer shadow-ed-pop [transition:all_0.1s] hover:text-ed-text hover:border-ed-border-strong"
            onClick={() => setSidebarCollapsed(false)}
            data-tooltip="Show panel" aria-label="Show panel"
          >
            <UI.PanelOpen size={16} strokeWidth={1.75} />
          </button>
        )}
        {!sidebarCollapsed && (
        <div className="editor-sidebar w-[340px] flex flex-col bg-ed-surface border-r border-solid border-ed-border shrink-0 relative">
          <div className="sidebar-header p-2.5 border-b border-solid border-ed-border flex gap-2 items-center bg-ed-surface min-h-[52px]">
            <PageSelect
              pages={pages}
              currentPageId={currentPageId}
              onChange={requestPageChange}
              onCreate={createPage}
              onUpdate={updatePage}
              onDuplicate={duplicatePage}
              onToggleHidden={togglePageHidden}
              onDelete={requestPageDelete}
              onCreateRoute={openRouteByUrl}
              onSelectGlobal={focusGlobalBlock}
              actionsDisabled={saveDisabled}
              actionsTooltip={saveTooltip}
            />
            <button
              className={iconBtn}
              onClick={() => setSidebarCollapsed(true)}
              data-tooltip="Collapse panel" aria-label="Collapse panel"
            >
              <UI.PanelClose size={16} strokeWidth={1.75} />
            </button>
          </div>

          <div className="tab-bar flex p-0.5 gap-0.5 bg-ed-surface-hover border border-solid border-ed-border m-2.5 rounded">
            {tabs.map((t) => (
              <button
                key={t.id}
                className={
                  'flex-1 h-[26px] px-2.5 text-[12px] font-medium border-none rounded cursor-pointer [transition:all_0.1s] ' +
                  (activeTab === t.id
                    ? 'active bg-ed-surface text-ed-text shadow-[0_0_0_1px_#9E9E99,0_1px_2px_rgba(0,0,0,0.08)]'
                    : 'bg-transparent text-ed-text hover:bg-ed-surface/60')
                }
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="tab-content flex-1 overflow-y-auto overflow-x-hidden px-3.5 pb-4">
            <div className="tab-content-inner w-[312px]">
            {activeTab === 'blocks' &&
              <CatalogPanel
                categories={categories}
                handleCatalogDragStart={handleCatalogDragStart}
                handleDragEnd={handleDragEnd}
              />}

            {activeTab === 'tree' && (
              <BlockTree
                sections={treeSections}
                dragType={dragType}
                dragData={dragData}
                treeDropTarget={treeDropTarget}
                setTreeDropTarget={setTreeDropTarget}
                expanded={treeExpanded}
                setExpanded={setTreeExpanded}
                selectedBlockId={selectedBlockId}
                setHoveredTreeId={setHoveredTreeId}
                handleTreeDragStart={handleTreeDragStart}
                handleDragEnd={handleDragEnd}
                handleTreeDragOver={handleTreeDragOver}
                handleTreeDrop={handleTreeDrop}
                handleSelect={handleSelect}
                duplicateBlock={duplicateBlock}
                copyBlock={copyBlock}
                deleteBlock={deleteBlock}
              />
            )}

            {activeTab === 'settings' && editingRoute && !selectedBlock && (
              <RouteSettings
                doc={doc}
                areas={routeAreas}
                activeArea={activeArea}
                onAreaChange={changeArea}
                onDisplayChange={setDisplayMode}
              />
            )}

            {activeTab === 'settings' && editingRoute && selectedBlock && (
              <button
                type="button"
                className="flex items-center gap-1.5 w-[calc(100%+28px)] -mx-[14px] py-2 px-[14px] bg-transparent border-x-0 border-t-0 border-b border-solid border-ed-code-border text-ed-text-muted text-[11.5px] text-left cursor-pointer hover:bg-ed-surface-hover hover:text-ed-text [&_svg]:shrink-0 [&_span]:truncate"
                onClick={() => setSelectedBlockId(null)}
              >
                <UI.ChevronLeft size={14} strokeWidth={1.75} />
                <span>{doc?.title || doc?.path || 'Page settings'}</span>
              </button>
            )}

            {activeTab === 'settings' && selectedBlock && selectedRegistry && (
              <Inspector
                onSelectParent={(() => {
                  const side = sideForBlockId(selectedBlockId);
                  const loc = side ? findBlockLocation(getBlocksFor(side), selectedBlockId, 'root-page') : null;
                  return loc && loc.parentId !== 'root-page' ? () => handleSelect(loc.parentId) : null;
                })()}
                selectedBlock={selectedBlock}
                selectedRegistry={selectedRegistry}
                insideLink={selectedInsideLink}
                device={device}
                frequentColors={frequentColors}
                hasOverride={hasOverride}
                resetOverride={resetOverride}
                updateBlockProp={updateBlockProp}
                updateBlockStyle={updateBlockStyle}
                patchBlockStyle={patchBlockStyle}
                openGroups={openGroups}
                toggleGroup={toggleGroup}
                openAccordion={openAccordion}
                setOpenAccordion={setOpenAccordion}
                listDrag={listDrag}
                setListDrag={setListDrag}
                duplicateBlock={duplicateBlock}
                copyBlock={copyBlock}
                cutBlock={cutBlock}
                deleteBlock={deleteBlock}
              />
            )}

            {activeTab === 'settings' && !selectedBlock && !editingRoute && (
              <div className="inspector-empty-hint px-4 py-8 text-center text-[13px] text-ed-text-soft leading-base">
                Select a block in the preview to edit its settings.
              </div>
            )}
            </div>
          </div>
        </div>
        )}

        <PreviewPanel
          device={device}
          onDeviceChange={setDevice}
          dragType={dragType}
          dragData={dragData}
          pages={pages}
          pagePath={pageData?.path}
          areas={editAreas}
          selectedBlockId={selectedBlockId}
          hoveredTreeId={hoveredTreeId}
          activeItem={activeItem}
          onSelectFromFrame={handleSelect}
          onDeleteFromFrame={deleteBlock}
          onDuplicateFromFrame={duplicateBlock}
          onCopyFromFrame={copyBlock}
          onCutFromFrame={cutBlock}
          onPasteFromFrame={pasteBlock}
          onUpdatePropFromFrame={updateBlockProp}
          onDropFromFrame={applyDrop}
          onCellDeleteFromFrame={handleCellDelete}
          onCellDuplicateFromFrame={handleCellDuplicate}
          isDirty={isDirty}
          onSave={save}
          isSaving={isSaving}
          saveRun={saveRun}
          saveDisabled={saveDisabled}
          saveTooltip={saveTooltip}
          canPush={canPush}
          pushPreview={pushPreview}
          pendingLabels={pendingLabels}
          onRefreshPushStatus={refreshPushStatus}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          setCurrentPageId={requestPageChange}
          setDropTarget={setDropTarget}
          handleDrop={handleDrop}
          onFileDragStart={startFileDrag}
          externalDrag={externalDrag}
          renderContent={() => barePage ? <main>{renderArea(PAGE_AREA)}</main> : (
            <PreviewChrome
              pagePath={pageData?.path}
              onEditGlobal={(path) => focusGlobalBlock(path.replace(/^\/+/, ''))}
              footerContent={renderArea('footer')}
              menuContent={renderArea('menu')}
              menuData={editAreas.menu}
            >
              <main>{renderPageArea()}</main>
            </PreviewChrome>
          )}
        />
      </div>
      <ConfirmModal
        open={!!pendingDelete}
        title="Delete page"
        message={pendingDelete ? `Delete “${pendingDelete.title}”?` : ''}
        detail={pendingDelete
          ? `${pendingDelete.path} — the page and its blocks are removed from the site. This cannot be undone here.`
          : ''}
        confirmLabel="Delete page"
        danger
        onClose={cancelDelete}
        onConfirm={confirmDelete}
      />
      <ConfirmModal
        open={!!pendingSwitchId}
        title="Discard unsaved changes?"
        message={pendingSwitchPage
          ? `Opening “${pendingSwitchPage.title}” discards the unsaved changes on this page.`
          : 'Opening another page discards the unsaved changes on this page.'}
        detail="Save first if you want to keep them."
        confirmLabel="Discard and open"
        danger
        onClose={cancelPageChange}
        onConfirm={confirmPageChange}
      />
    </div>
  );
}
