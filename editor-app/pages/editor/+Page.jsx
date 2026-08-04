import { useState, useEffect, useCallback, useMemo } from 'react';
import registry from 'editor-core/registry';
import { renderPage } from 'editor-core/renderer';
import { UI } from '../../src/editor/Icon.jsx';
import PreviewChrome from '../../src/editor/PreviewChrome.jsx';
import '../../src/styles/editor.less';

import { allBlocks, deviceChain } from './lib/hostBlocks.jsx';
import { collectFrequentColors } from './lib/color.js';
import { PageSelect } from './fields/PageSelect.jsx';
import { PreviewPanel } from './preview/PreviewPanel.jsx';
import { Inspector } from './Inspector.jsx';
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
  const [pageData, setPageData] = useState(null);
  const [footerData, setFooterData] = useState(null);
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

  const mainDirty = pageData && JSON.stringify(pageData) !== savedPageJson;
  const footerDirty = footerData && JSON.stringify(footerData) !== savedFooterJson;
  const isDirty = mainDirty || footerDirty;
  const editingFooterPage = currentPageId === FOOTER_PAGE_ID;

  const { buildOutdated } = useBuildVersion(isDirty);

  const refreshPages = useCallback(async () => {
    const list = await fetch('/api/editor/pages').then((r) => r.json());
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

  useEffect(() => {
    if (currentPageId) {
      fetch(`/api/editor/pages/${currentPageId}`).then((r) => r.json()).then((data) => {
        skipHistoryRef.current.page = true;
        setPageData(data);
        setSavedPageJson(JSON.stringify(data));
        resetHistory();
        lastSnapshotRef.current.page = null;
      });
    }
  }, [currentPageId]);


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
  const { isPushing, canPush, save, push } = useSavePush({
    currentPageId, pageData, footerData, mainDirty, footerDirty,
    setSavedPageJson, setSavedFooterJson, showToast,
  });


  const {
    activeTarget, sideForBlockId, getBlocksFor, setBlocksFor, isDropAllowed,
    handleSelect, addBlock, deleteBlock, duplicateBlock, writeField,
    updateBlockProp, updateBlockStyle, patchBlockStyle, hasOverride, resetOverride,
    selectedBlock, selectedRegistry, currentBlocks,
  } = useBlockActions({
    pageData, setPageData, footerData, setFooterData,
    selectedBlockId, setSelectedBlockId, setActiveTab, device,
  });

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
        <div className="empty-state" style={{ padding: 60 }}>Loading...</div>
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
          className={`editor-toast editor-toast--${toast.type}`}
          onClick={() => dismissToast()}
        >
          {toast.message}
        </div>
      )}
      <div className="editor">
        {sidebarCollapsed && (
          <button
            className="editor-expand"
            onClick={() => setSidebarCollapsed(false)}
            title="Show panel"
          >
            <UI.PanelOpen size={16} strokeWidth={1.75} />
          </button>
        )}
        {/* LEFT PANEL */}
        {!sidebarCollapsed && (
        <div className="editor-sidebar">
          <div className="sidebar-header">
            <PageSelect
              pages={pages}
              currentPageId={currentPageId}
              onChange={setCurrentPageId}
              onCreate={createPage}
            />
            <button
              className="icon-btn"
              onClick={() => setSidebarCollapsed(true)}
              title="Collapse panel"
            >
              <UI.PanelClose size={16} strokeWidth={1.75} />
            </button>
          </div>

          <div className="tab-bar">
            {tabs.map((t) => (
              <button key={t.id} className={activeTab === t.id ? 'active' : ''} onClick={() => setActiveTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {activeTab === 'blocks' &&
              <CatalogPanel
                categories={categories}
                handleCatalogDragStart={handleCatalogDragStart}
                handleDragEnd={handleDragEnd}
                addBlock={addBlock}
              />}

            {activeTab === 'tree' && (
              <BlockTree
                currentBlocks={currentBlocks}
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

            {activeTab === 'settings' && selectedBlock && selectedRegistry && (
              <Inspector
                selectedBlock={selectedBlock}
                selectedRegistry={selectedRegistry}
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

            {activeTab === 'settings' && !selectedBlock && (
              <div className="inspector-empty-hint">
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
              onEditGlobal={(path) => {
                const match = pages.find((p) => p.path === path);
                if (match) setCurrentPageId(match.id);
              }}
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
                {renderPage(pageData, {
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
                })}
              </main>
            </PreviewChrome>
          )}
        />
      </div>
    </div>
  );
}
