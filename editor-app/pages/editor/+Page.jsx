import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import registry from 'editor-core/registry';
import { renderPage, renderPageBlocks } from 'editor-core/renderer';
import { UI } from '../../src/editor/Icon.jsx';
import PreviewChrome from '../../src/editor/PreviewChrome.jsx';
import RoutePreview from '../../src/editor/RoutePreview.jsx';
import '../../src/styles/editor-tailwind.css';
import '../../src/styles/editor-remnants.css';

import { allBlocks, deviceChain } from './lib/hostBlocks.jsx';
import { collectFrequentColors } from './lib/color.js';
import { PageSelect } from './fields/PageSelect.jsx';
import { PreviewPanel } from './preview/PreviewPanel.jsx';
import { Inspector } from './Inspector.jsx';
import { RouteSettings } from './RouteSettings.jsx';
import { resolveRoute } from './lib/resolveRoute.js';
import { areasForDoc, bareRouteId, isRouteId, toRouteId, viewOfArea, foldArea } from './lib/docView.js';
import { BlockTree } from './BlockTree.jsx';
import { CatalogPanel } from './CatalogPanel.jsx';
import { useToast } from './hooks/useToast.js';
import { useBuildVersion } from './hooks/useBuildVersion.js';
import { useSavePush } from './hooks/useSavePush.js';
import { useHistory } from './hooks/useHistory.js';
import { useDragDrop } from './hooks/useDragDrop.js';
import { useBlockActions } from './hooks/useBlockActions.js';

const FOOTER_PAGE_ID = '__footer__';

export default function EditorPage() {
  const [pages, setPages] = useState([]);
  const [currentPageId, setCurrentPageId] = useState('home');
  // What was loaded, exactly as it is stored. For a page this is also what the
  // editing hooks work on; for a route document they get a per-area view of it.
  const [doc, setDoc] = useState(null);
  const [activeArea, setActiveArea] = useState(null);
  const [footerData, setFooterData] = useState(null);

  const editingRoute = isRouteId(currentPageId);
  const routeAreas = editingRoute ? areasForDoc(doc) : [];

  const pageData = useMemo(
    () => (editingRoute ? viewOfArea(doc, activeArea) : doc),
    [doc, editingRoute, activeArea],
  );

  // Read through a ref, and keep the callback's identity stable: the editing
  // hooks memoise their setters with dependency lists that do not include this
  // one, so a new identity per document would never reach them.
  const projectionRef = useRef({ editingRoute: false, activeArea: null });
  projectionRef.current = { editingRoute, activeArea };

  const setPageData = useCallback((next) => {
    setDoc((prev) => {
      if (!prev) return prev;
      const { editingRoute: isRoute, activeArea: area } = projectionRef.current;
      if (!isRoute) return typeof next === 'function' ? next(prev) : next;
      const view = viewOfArea(prev, area);
      const updated = typeof next === 'function' ? next(view) : next;
      return foldArea(prev, area, updated);
    });
  }, []);

  const { undo, redo, canUndo, canRedo, skipHistoryRef, lastSnapshotRef, resetHistory } = useHistory({ pageData, setPageData, footerData, setFooterData });
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [activeTab, setActiveTab] = useState('blocks');
  const [savedPageJson, setSavedPageJson] = useState(null);
  const [savedFooterJson, setSavedFooterJson] = useState(null);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [listDrag, setListDrag] = useState({ key: null, fromIdx: null, overIdx: null });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [device, setDevice] = useState('desktop');
  const [hoveredTreeId, setHoveredTreeId] = useState(null);
  const devices = deviceChain(device);

  const frequentColors = useMemo(
    () => collectFrequentColors(pageData),
    [pageData]
  );

  // Compared on the stored document, not the editing view: switching areas
  // changes the view without changing anything worth saving.
  const mainDirty = doc && JSON.stringify(doc) !== savedPageJson;
  const footerDirty = footerData && JSON.stringify(footerData) !== savedFooterJson;
  const isDirty = mainDirty || footerDirty;
  const editingFooterPage = currentPageId === FOOTER_PAGE_ID;

  const { buildOutdated } = useBuildVersion(isDirty);

  // Pages and route documents share one picker, so they share one list. Route
  // ids are prefixed to keep them apart in a single `currentPageId`.
  const refreshPages = useCallback(async () => {
    const [pageList, routeList] = await Promise.all([
      fetch('/api/editor/pages').then((r) => r.json()).catch(() => []),
      fetch('/api/editor/routes').then((r) => r.json()).catch(() => []),
    ]);
    const list = [
      ...pageList.map((p) => ({ ...p, kind: 'page' })),
      ...routeList.map((r) => ({ ...r, id: toRouteId(r.id), kind: 'route' })),
    ];
    setPages(list);
    return list;
  }, []);

  useEffect(() => {
    refreshPages();
  }, [refreshPages]);

  const createPage = useCallback(async ({ title, path }) => {
    if (!title) return { error: 'Enter a title' };
    if (!path || !path.startsWith('/')) return { error: 'Path must start with /' };
    const res = await fetch('/api/editor/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, path }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.error || 'Failed to create page' };
    }
    const created = await res.json();
    await refreshPages();
    setCurrentPageId(created.id);
    return { ok: true };
  }, [refreshPages]);

  /**
   * Opens the storefront URL an author typed: Magento is asked what lives
   * there, and a document for it is created on first use. Reopening an already
   * edited URL just selects it.
   */
  const openRouteByUrl = useCallback(async (input) => {
    const resolved = await resolveRoute(input);
    if (resolved.error) return { error: resolved.error };

    const existing = pages.find((p) => p.kind === 'route' && p.path === resolved.path);
    if (existing) {
      setCurrentPageId(existing.id);
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
      // A document created in another tab since this list was fetched.
      if (created.id) {
        await refreshPages();
        setCurrentPageId(toRouteId(created.id));
        return { ok: true };
      }
      return { error: created.error || 'Could not create the document' };
    }
    await refreshPages();
    setCurrentPageId(toRouteId(created.id));
    return { ok: true };
  }, [pages, refreshPages]);

  useEffect(() => {
    if (!currentPageId) return;
    const isRoute = isRouteId(currentPageId);
    const url = isRoute
      ? `/api/editor/routes/${bareRouteId(currentPageId)}`
      : `/api/editor/pages/${currentPageId}`;
    fetch(url).then((r) => r.json()).then((data) => {
      skipHistoryRef.current.page = true;
      setDoc(data);
      setActiveArea(isRoute ? areasForDoc(data)[0]?.id || null : null);
      setSavedPageJson(JSON.stringify(data));
      resetHistory();
      lastSnapshotRef.current.page = null;
    });
  }, [currentPageId]);

  // Switching area swaps the whole editing view; that is navigation, not an
  // edit, so it must not land in the undo stack.
  const changeArea = useCallback((id) => {
    skipHistoryRef.current.page = true;
    setSelectedBlockId(null);
    setActiveArea(id);
  }, []);

  const setDisplayMode = useCallback((mode) => {
    setDoc((prev) => (prev ? { ...prev, display: mode } : prev));
  }, []);


  useEffect(() => {
    if (editingFooterPage) {
      skipHistoryRef.current.footer = true;
      setFooterData(null);
      lastSnapshotRef.current.footer = null;
      return;
    }
    let cancelled = false;
    const load = () =>
      fetch(`/api/editor/pages/${FOOTER_PAGE_ID}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled || !data) return;
          skipHistoryRef.current.footer = true;
          setFooterData(data);
          setSavedFooterJson(JSON.stringify(data));
        })
        .catch(() => {});
    load();
    return () => { cancelled = true; };
  }, [editingFooterPage]);

  const { toast, showToast, dismissToast } = useToast();
  const mainDoc = useMemo(() => ({
    endpoint: editingRoute
      ? `/api/editor/routes/${bareRouteId(currentPageId)}`
      : `/api/editor/pages/${currentPageId}`,
    id: currentPageId,
    kind: editingRoute ? 'route' : 'page',
    path: doc?.path,
    body: doc,
  }), [editingRoute, currentPageId, doc]);

  const { isPushing, canPush, save, push } = useSavePush({
    mainDoc, footerData, mainDirty, footerDirty,
    setSavedPageJson, setSavedFooterJson, showToast,
  });


  const {
    activeTarget, sideForBlockId, getBlocksFor, setBlocksFor, isDropAllowed,
    handleSelect, addBlock, deleteBlock, duplicateBlock, writeField,
    updateBlockProp, updateBlockStyle, patchBlockStyle, hasOverride, resetOverride,
    selectedBlock, selectedRegistry, selectedInsideLink,
  } = useBlockActions({
    pageData, setPageData, footerData, setFooterData,
    selectedBlockId, setSelectedBlockId, setActiveTab, device,
  });

  const focusGlobalBlock = useCallback((id) => {
    if (id !== FOOTER_PAGE_ID) return;
    const first = footerData?.blocks?.[0]?.id;
    if (first) handleSelect(first);
    let attempts = 0;
    const tryScroll = () => {
      const el = document.querySelector(`[data-global-block="${FOOTER_PAGE_ID}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else if (++attempts < 10) requestAnimationFrame(tryScroll);
    };
    requestAnimationFrame(tryScroll);
  }, [footerData, handleSelect]);

  // Drag and drop
  const {
    dragType, dragData, dropTarget, treeDropTarget,
    setDragType, setDragData, setDropTarget, setTreeDropTarget,
    isDraggingValue, draggedComponent, validateDrop,
    handleCatalogDragStart, handleTreeDragStart, handlePreviewDragStart, handlePreviewCellDragStart,
    handleCellDelete, handleCellDuplicate, handleDragEnd, handleTreeDragOver, handleTreeDrop, handleDrop,
  } = useDragDrop({ pageData, footerData, isDropAllowed, sideForBlockId, activeTarget, getBlocksFor, setBlocksFor, setSelectedBlockId, setActiveTab });

  const [openGroups, setOpenGroups] = useState({});
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

  if (!pageData) {
    return (
      <div className="editor-root">
        <div className="text-e-text-soft text-center py-[30px] px-5 text-[12.5px]" style={{ padding: 60 }}>Loading...</div>
      </div>
    );
  }

  const categories = {
    layout: { label: 'Layout', items: [] },
    content: { label: 'Content', items: [] },
    domain: { label: 'Components', items: [] },
  };
  Object.entries(registry).forEach(([name, reg]) => {
    categories[reg.category]?.items.push({ name, ...reg });
  });

  const tabs = [
    { id: 'blocks', label: 'Blocks' },
    { id: 'tree', label: 'Tree' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="editor-root">
      {buildOutdated && (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: 12, right: 12, zIndex: 2000,
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px',
            background: '#1d4ed8',
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
              color: '#1d4ed8',
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
          className={`fixed top-3 right-3 z-[2000] max-w-[520px] py-[10px] px-[14px] text-white rounded-e-xl text-[13px] leading-[1.45] shadow-[0_6px_16px_rgba(15,23,42,0.25)] cursor-pointer whitespace-pre-wrap animate-[editor-toast-in_160ms_ease-out] ${toast.type === 'success' ? 'bg-e-success' : toast.type === 'error' ? 'bg-e-danger' : 'bg-e-info'}`}
          onClick={() => dismissToast()}
        >
          {toast.message}
        </div>
      )}
      <div className="editor flex h-screen bg-e-bg">
        {sidebarCollapsed && (
          <button
            className="editor-expand absolute top-3 left-3 z-10 w-8 h-8 inline-flex items-center justify-center border border-e-border bg-e-surface rounded-e text-e-text-muted cursor-pointer shadow-e-pop transition-all duration-100 hover:text-e-text hover:border-e-border-strong"
            onClick={() => setSidebarCollapsed(false)}
            title="Show panel"
          >
            <UI.PanelOpen size={16} strokeWidth={1.75} />
          </button>
        )}
        {/* LEFT PANEL */}
        {!sidebarCollapsed && (
        <div className="editor-sidebar w-[320px] flex flex-col bg-e-surface border-r border-e-border flex-shrink-0 relative z-[1]">
          <div className="sidebar-header p-2.5 border-b border-e-border flex gap-2 items-center bg-e-surface min-h-[52px]">
            <PageSelect
              pages={pages}
              currentPageId={currentPageId}
              onChange={setCurrentPageId}
              onCreate={createPage}
              onCreateRoute={openRouteByUrl}
              onSelectGlobal={focusGlobalBlock}
            />
            <button
              className="icon-btn w-7 h-7 inline-flex items-center justify-center border border-transparent bg-transparent text-e-text-muted rounded-e cursor-pointer transition-all duration-100 flex-shrink-0 enabled:hover:bg-e-surface-hover enabled:hover:text-e-text enabled:hover:border-e-border disabled:opacity-[0.35] disabled:cursor-not-allowed"
              onClick={() => setSidebarCollapsed(true)}
              title="Collapse panel"
            >
              <UI.PanelClose size={16} strokeWidth={1.75} />
            </button>
          </div>

          <div className="tab-bar flex p-1 gap-0.5 bg-e-surface-alt m-2.5 rounded-e">
            {tabs.map((t) => (
              <button key={t.id} className={`flex-1 h-[26px] px-2.5 text-[12px] font-medium border-0 rounded-e-sm cursor-pointer bg-transparent text-e-text-muted transition-all duration-100 hover:text-e-text [&.active]:bg-e-surface [&.active]:text-e-text [&.active]:shadow-[0_1px_2px_rgba(0,0,0,0.06)] ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="tab-content flex-1 overflow-auto px-3.5 pb-4">
            {activeTab === 'blocks' &&
              <CatalogPanel
                categories={categories}
                handleCatalogDragStart={handleCatalogDragStart}
                handleDragEnd={handleDragEnd}
                addBlock={addBlock}
              />}

            {activeTab === 'tree' && (
              <BlockTree
                areas={[
                  {
                    id: 'page',
                    label: editingRoute
                      ? routeAreas.find((a) => a.id === activeArea)?.label || 'Area'
                      : 'Page',
                    blocks: pageData.blocks || [],
                  },
                  ...(footerData ? [{ id: 'footer', label: 'Footer', blocks: footerData.blocks || [] }] : []),
                ]}
                dragType={dragType}
                dragData={dragData}
                treeDropTarget={treeDropTarget}
                setTreeDropTarget={setTreeDropTarget}
                selectedBlockId={selectedBlockId}
                setHoveredTreeId={setHoveredTreeId}
                handleTreeDragStart={handleTreeDragStart}
                handleDragEnd={handleDragEnd}
                handleTreeDragOver={handleTreeDragOver}
                handleTreeDrop={handleTreeDrop}
                handleSelect={handleSelect}
                duplicateBlock={duplicateBlock}
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

            {/* The block inspector replaces the page's own settings, so the way
                back to them has to be part of it — a click on empty canvas is
                not something an author can be expected to guess. */}
            {activeTab === 'settings' && editingRoute && selectedBlock && (
              <button
                type="button"
                className="flex items-center gap-1.5 w-[calc(100%+28px)] -mx-[14px] py-2 px-[14px] bg-transparent border-x-0 border-t-0 border-b border-solid border-e-code-border text-e-text-muted text-[11.5px] text-left cursor-pointer hover:bg-e-surface-hover hover:text-e-text [&_svg]:shrink-0 [&_span]:truncate"
                onClick={() => setSelectedBlockId(null)}
              >
                <UI.ChevronLeft size={14} strokeWidth={1.75} />
                <span>{doc?.title || doc?.path || 'Page settings'}</span>
              </button>
            )}

            {activeTab === 'settings' && selectedBlock && selectedRegistry && (
              <Inspector
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
                deleteBlock={deleteBlock}
              />
            )}

            {activeTab === 'settings' && !selectedBlock && !editingRoute && (
              <div className="py-8 px-4 text-center text-[13px] text-e-text-soft leading-[1.5]">
                Select a block in the preview to edit its settings.
              </div>
            )}
          </div>
        </div>
        )}

        <PreviewPanel
          device={device}
          onDeviceChange={setDevice}
          dragType={dragType}
          pages={pages}
          pagePath={pageData?.path}
          pageData={pageData}
          footerData={footerData}
          selectedBlockId={selectedBlockId}
          hoveredTreeId={hoveredTreeId}
          onSelectFromFrame={handleSelect}
          onDeselect={() => setSelectedBlockId(null)}
          onDeleteFromFrame={deleteBlock}
          onDuplicateFromFrame={duplicateBlock}
          onUpdatePropFromFrame={updateBlockProp}
          isDirty={isDirty}
          onSave={save}
          onPush={push}
          isPushing={isPushing}
          canPush={canPush}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          setCurrentPageId={setCurrentPageId}
          setDropTarget={setDropTarget}
          handleDrop={handleDrop}
          renderContent={() => (
            <PreviewChrome
              pagePath={pageData?.path}
              onEditGlobal={(path) => focusGlobalBlock(path.replace(/^\/+/, ''))}
              footerContent={footerData ? renderPage(footerData, {
                blocks: allBlocks,
                onSelect: handleSelect,
                onDelete: deleteBlock,
                onDuplicate: duplicateBlock,
                onUpdateProp: updateBlockProp,
                selectedId: selectedBlockId,
                hoveredId: hoveredTreeId,
                isDragging: isDraggingValue,
                dropTarget,
                onDropTargetChange: setDropTarget,
                validateDrop,
                onDragStartBlock: handlePreviewDragStart,
                onCellDragStart: handlePreviewCellDragStart,
                onCellDelete: handleCellDelete,
                onCellDuplicate: handleCellDuplicate,
                onDragEndBlock: handleDragEnd,
                editingTarget: 'footer',
                devices,
              }) : null}
            >
              <main>
                {(() => {
                  const opts = {
                    blocks: allBlocks,
                    onSelect: handleSelect,
                    onDelete: deleteBlock,
                    onDuplicate: duplicateBlock,
                    onUpdateProp: updateBlockProp,
                    selectedId: selectedBlockId,
                    hoveredId: hoveredTreeId,
                    isDragging: isDraggingValue,
                    dropTarget,
                    onDropTargetChange: setDropTarget,
                    validateDrop,
                    onDragStartBlock: handlePreviewDragStart,
                    onCellDragStart: handlePreviewCellDragStart,
                    onCellDelete: handleCellDelete,
                    onCellDuplicate: handleCellDuplicate,
                    onDragEndBlock: handleDragEnd,
                    editingTarget: 'page',
                    devices,
                  };
                  // A route document decorates a page the storefront owns, so
                  // the area is rendered inside that page rather than alone.
                  return editingRoute
                    ? <RoutePreview doc={doc}>{renderPageBlocks(pageData, opts)}</RoutePreview>
                    : renderPage(pageData, opts);
                })()}
              </main>
            </PreviewChrome>
          )}
        />
      </div>
    </div>
  );
}
