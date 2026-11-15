import {useRef, useEffect, useCallback, useLayoutEffect, useState} from 'react';
import {UI} from '../../../src/editor/Icon.jsx';
import {DEVICE_WIDTHS} from '../lib/hostBlocks.jsx';
import {iconBtn, btnSave} from '../lib/cls.js';
import {SaveConfirmModal} from '../SaveConfirmModal.jsx';
import {SiteSettingsModal} from '../SiteSettingsModal.jsx';
import {SaveButton} from './SaveButton.jsx';
import {useEditorUser, signOut} from '../../../src/editor/editorSession.jsx';

export function PreviewPanel({
                                 device,
                                 onDeviceChange,
                                 dragType,
                                 dragData,
                                 externalDrag,
                                 onFileDragStart,
                                 pages,
                                 pagePath,
                                 areas,
                                 selectedBlockId,
                                 hoveredTreeId,
                                 activeItem,
                                 onSelectFromFrame,
                                 onDeleteFromFrame,
                                 onDuplicateFromFrame,
                                 onCopyFromFrame,
                                 onCutFromFrame,
                                 onPasteFromFrame,
                                 onUpdatePropFromFrame,
                                 onDropFromFrame,
                                 onCellDeleteFromFrame,
                                 onCellDuplicateFromFrame,
                                 isDirty,
                                 onSave,
                                 isSaving,
                                 saveRun,
                                 saveDisabled = false,
                                 saveTooltip = null,
                                 canPush,
                                 pushPreview,
                                 pendingLabels,
                                 onRefreshPushStatus,
                                 onUndo,
                                 onRedo,
                                 canUndo,
                                 canRedo,
                                 setCurrentPageId,
                                 setDropTarget,
                                 handleDrop,
                                 renderContent
                             }) {
    const ref = useRef(null);
    const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
    const [siteSettingsOpen, setSiteSettingsOpen] = useState(false);
    const editorUser = useEditorUser();
    const [siteSettings, setSiteSettings] = useState(() => (typeof window !== 'undefined' && window.__SITE_SETTINGS__) || null);
    useEffect(() => {
        let live = true;
        fetch('/api/editor/site-settings', {cache: 'no-store'})
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => live && data && setSiteSettings(data))
            .catch(() => {});
        return () => { live = false; };
    }, [siteSettingsOpen]);
    const saveSiteSettings = async (next) => {
        const res = await fetch('/api/editor/site-settings', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(next),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
        setSiteSettings(data);
    };
    const maintenanceOn = !!siteSettings?.maintenance?.enabled;
    const innerRef = useRef(null);
    const deviceWidth = DEVICE_WIDTHS[device];

    useLayoutEffect(() => {
        const outer = ref.current;
        const inner = innerRef.current;
        if (!outer) return;
        const update = () => {
            const target = inner || outer;
            target.style.setProperty('--fbw', `${target.clientWidth}px`);
        };
        update();
        const obs = new ResizeObserver(update);
        obs.observe(outer);
        if (inner) obs.observe(inner);
        return () => obs.disconnect();
    }, [device]);

    const devices = [
        {id: 'desktop', label: 'Desktop', Icon: UI.Monitor},
        {id: 'tablet', label: 'Tablet', Icon: UI.Tablet},
        {id: 'mobile', label: 'Mobile', Icon: UI.Phone},
    ];

    return (
        <div
            ref={ref}
            className="editor-preview flex flex-col flex-1 overflow-auto bg-ed-bg relative"
            onClickCapture={(e) => {
                if (typeof window !== 'undefined' && window.__editorPicking) return;
                const link = e.target.closest && e.target.closest('a');
                if (!link) return;
                // A block's own link wrapper (BlockWrapper renders it right under
                // the block root) is inert in the editor: clicks inside select.
                if (link.parentElement?.hasAttribute('data-block-id')) return;
                if (link.isContentEditable || link.querySelector('[contenteditable="true"]')) return;
                const href = link.getAttribute('href');
                if (!href || href.startsWith('#')) return;
                e.preventDefault();
                e.stopPropagation();
                if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
                    e.nativeEvent.stopImmediatePropagation();
                }
                const match = pages.find((p) => p.path === href);
                if (match) setCurrentPageId(match.id);
            }}
            onDragEnter={(e) => {
                if (dragType) return;
                const types = [...e.dataTransfer.types];
                if (types.includes('Files')) onFileDragStart?.('Image');
                else if (types.includes('text/plain')) onFileDragStart?.('Text');
            }}
            onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = dragType === 'new' ? 'copy' : 'move';
            }}
            onDragLeave={() => setDropTarget(null)}
            onDrop={(e) => {
                e.preventDefault();
                handleDrop({
                    file: e.dataTransfer.files?.[0] || null,
                    text: e.dataTransfer.getData('text/plain'),
                });
            }}
        >
            <div className="editor-preview-toolbar sticky top-0 z-[5] flex items-center gap-2.5 justify-center px-3 py-2 bg-ed-code-bg border-b border-solid border-ed-border">
                <div className="device-switch inline-flex bg-ed-surface border border-solid border-ed-border rounded p-[3px] gap-0.5">
                    {devices.map((d) => (
                        <button
                            key={d.id}
                            type="button"
                            className={
                                'device-switch-item inline-flex items-center gap-1.5 px-2.5 py-1 h-7 border-none text-[12px] ' +
                                'font-medium rounded cursor-pointer [transition:all_0.1s] ' +
                                (device === d.id
                                    ? 'active text-ed-text bg-ed-primary-soft shadow-[0_0_0_1px_#0F4C5C]'
                                    : 'bg-transparent text-ed-text-muted hover:text-ed-text hover:bg-ed-code-bg')
                            }
                            onClick={() => onDeviceChange(d.id)}
                            data-tooltip={d.label} aria-label={d.label}
                        >
                            <d.Icon size={15} strokeWidth={1.75}/>
                            <span>{d.label}</span>
                        </button>
                    ))}
                </div>
                {deviceWidth != null && (
                    <span className="device-width-hint text-[11px] text-ed-text-soft font-ed-mono">{deviceWidth}px</span>
                )}
                <div className="editor-preview-toolbar-actions absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {editorUser && (
                        <>
                            <span
                                className="editor-user inline-flex items-center gap-1 mr-1 text-[12px] text-ed-text-muted"
                                data-tooltip={`Signed in as admin #${editorUser.id ?? '?'}`}
                            >
                                <UI.User size={14} strokeWidth={1.75}/>
                                {editorUser.username}
                            </span>
                            <button
                                type="button"
                                className={iconBtn}
                                onClick={signOut}
                                data-tooltip="Sign out"
                                aria-label="Sign out"
                            >
                                <UI.LogOut size={15} strokeWidth={1.75}/>
                            </button>
                        </>
                    )}
                    <button
                        type="button"
                        className={iconBtn}
                        onClick={onUndo}
                        disabled={!canUndo}
                        data-tooltip="Undo"
                        aria-label="Undo"
                    >
                        <UI.UndoArrow size={16} strokeWidth={1.75}/>
                    </button>
                    <button
                        type="button"
                        className={iconBtn}
                        onClick={onRedo}
                        disabled={!canRedo}
                        data-tooltip="Redo"
                        aria-label="Redo"
                    >
                        <UI.RedoArrow size={16} strokeWidth={1.75}/>
                    </button>
                    <button
                        type="button"
                        className={maintenanceOn ? `${btnSave} !bg-ed-danger enabled:hover:!bg-ed-danger` : iconBtn}
                        onClick={() => setSiteSettingsOpen(true)}
                        data-tooltip={maintenanceOn ? 'Maintenance mode is on' : 'Site settings'}
                        aria-label="Site settings"
                    >
                        <UI.Settings size={14} strokeWidth={2}/>
                        {maintenanceOn && 'Maintenance on'}
                    </button>
                    <SiteSettingsModal
                        open={siteSettingsOpen}
                        settings={siteSettings}
                        onClose={() => setSiteSettingsOpen(false)}
                        onSave={saveSiteSettings}
                    />
                    <span
                        className="inline-flex"
                        data-tooltip={saveDisabled && saveTooltip ? saveTooltip : undefined}
                        aria-label={saveDisabled && saveTooltip ? `Save - ${saveTooltip}` : undefined}
                    >
                        <SaveButton
                            isSaving={isSaving}
                            saveRun={saveRun}
                            disabled={saveDisabled || (!isDirty && !canPush)}
                            onClick={() => {
                                onRefreshPushStatus?.();
                                setSaveConfirmOpen(true);
                            }}
                            onRetry={onSave}
                        />
                    </span>
                    <SaveConfirmModal
                        open={saveConfirmOpen}
                        pending={pendingLabels}
                        preview={pushPreview}
                        onClose={() => setSaveConfirmOpen(false)}
                        onConfirm={() => {
                            setSaveConfirmOpen(false);
                            onSave();
                        }}
                    />
                </div>
            </div>
            {device === 'desktop' ? (
                <div
                    className="editor-preview-inner bg-ed-surface min-h-full"
                    ref={innerRef}
                >
                    {renderContent()}
                </div>
            ) : (
                <DeviceFrame
                    device={device}
                    width={deviceWidth}
                    areas={areas}
                    selectedBlockId={selectedBlockId}
                    hoveredTreeId={hoveredTreeId}
                    activeItem={activeItem}
                    onSelectFromFrame={onSelectFromFrame}
                    onDeleteFromFrame={onDeleteFromFrame}
                    onDuplicateFromFrame={onDuplicateFromFrame}
                    onCopyFromFrame={onCopyFromFrame}
                    onCutFromFrame={onCutFromFrame}
                    onPasteFromFrame={onPasteFromFrame}
                    onUpdatePropFromFrame={onUpdatePropFromFrame}
                    dragType={dragType}
                    dragData={dragData}
                    externalDrag={externalDrag}
                    onDropFromFrame={onDropFromFrame}
                    onCellDeleteFromFrame={onCellDeleteFromFrame}
                    onCellDuplicateFromFrame={onCellDuplicateFromFrame}
                />
            )}
        </div>
    );
}

function DeviceFrame({
                         device,
                         width,
                         areas,
                         selectedBlockId,
                         hoveredTreeId,
                         activeItem,
                         onSelectFromFrame,
                         onDeleteFromFrame,
                         onDuplicateFromFrame,
                         onCopyFromFrame,
                         onCutFromFrame,
                         onPasteFromFrame,
                         onUpdatePropFromFrame,
                         dragType,
                         dragData,
                         externalDrag,
                         onDropFromFrame,
                         onCellDeleteFromFrame,
                         onCellDuplicateFromFrame
                     }) {
    const iframeRef = useRef(null);
    const readyRef = useRef(false);

    const postDragState = useCallback(() => {
        const win = iframeRef.current?.contentWindow;
        if (!win || !readyRef.current) return;
        win.postMessage({type: 'dragState', dragType, dragData, external: externalDrag}, '*');
    }, [dragType, dragData, externalDrag]);

    const postData = useCallback(() => {
        const win = iframeRef.current?.contentWindow;
        if (!win || !readyRef.current) return;
        // The frame gets the whole area map, so a new region needs no change here.
        win.postMessage(
            {type: 'pageData', areas, selectedId: selectedBlockId, hoveredId: hoveredTreeId, activeItem},
            '*'
        );
    }, [areas, selectedBlockId, hoveredTreeId, activeItem]);

    useEffect(() => {
        const onMessage = (e) => {
            if (e.source !== iframeRef.current?.contentWindow) return;
            const msg = e.data;
            if (!msg || typeof msg !== 'object') return;
            if (msg.type === 'frame-ready') {
                readyRef.current = true;
                postData();
                postDragState();
            } else if (msg.type === 'select' && onSelectFromFrame) {
                onSelectFromFrame(msg.id);
            } else if (msg.type === 'delete' && onDeleteFromFrame) {
                onDeleteFromFrame(msg.id);
            } else if (msg.type === 'duplicate' && onDuplicateFromFrame) {
                onDuplicateFromFrame(msg.id);
            } else if (msg.type === 'copy' && onCopyFromFrame) {
                onCopyFromFrame(msg.id);
            } else if (msg.type === 'cut' && onCutFromFrame) {
                onCutFromFrame(msg.id);
            } else if (msg.type === 'paste' && onPasteFromFrame) {
                onPasteFromFrame(msg.id);
            } else if (msg.type === 'updateProp' && onUpdatePropFromFrame) {
                onUpdatePropFromFrame(msg.id, msg.key, msg.value);
            } else if (msg.type === 'drop' && onDropFromFrame) {
                onDropFromFrame(msg.drop || {});
            } else if (msg.type === 'cellDelete' && onCellDeleteFromFrame) {
                onCellDeleteFromFrame(msg.payload);
            } else if (msg.type === 'cellDuplicate' && onCellDuplicateFromFrame) {
                onCellDuplicateFromFrame(msg.payload);
            }
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [postData, postDragState, onSelectFromFrame, onDeleteFromFrame, onDuplicateFromFrame, onCopyFromFrame, onCutFromFrame, onPasteFromFrame, onUpdatePropFromFrame, onDropFromFrame, onCellDeleteFromFrame, onCellDuplicateFromFrame]);

    useEffect(() => {
        postData();
    }, [postData]);

    useEffect(() => {
        postDragState();
    }, [postDragState]);

    return (
        <div className="device-frame flex-1 flex flex-col items-center p-4 min-h-0 gap-2.5 overflow-auto">
            <iframe
                ref={iframeRef}
                className="shrink-0 rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.08)] bg-ed-surface block max-h-full"
                title={`Preview (${device})`}
                src="/__preview__"
                style={{width, height: '100%', border: 'none', background: '#fff'}}
                onLoad={() => {
                    readyRef.current = true;
                    postData();
                }}
            />
        </div>
    );
}
