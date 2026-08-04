import {useRef, useEffect, useCallback, useLayoutEffect} from 'react';
import {UI} from '../../../src/editor/Icon.jsx';
import {DEVICE_WIDTHS} from '../lib/hostBlocks.jsx';

export function PreviewPanel({
                                 device,
                                 onDeviceChange,
                                 dragType,
                                 pages,
                                 pagePath,
                                 pageData,
                                 footerData,
                                 selectedBlockId,
                                 hoveredTreeId,
                                 onSelectFromFrame,
                                 onDeselect,
                                 onDeleteFromFrame,
                                 onDuplicateFromFrame,
                                 onUpdatePropFromFrame,
                                 isDirty,
                                 onSave,
                                 onPush,
                                 isPushing,
                                 canPush,
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
            className="editor-preview"
            onClick={(e) => {
                if (!e.target?.closest?.('[data-block-id]')) onDeselect?.();
            }}
            onClickCapture={(e) => {
                if (typeof window !== 'undefined' && window.__editorPicking) return;
                const link = e.target.closest && e.target.closest('a');
                if (!link) return;
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
            onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = dragType === 'new' ? 'copy' : 'move';
            }}
            onDragLeave={() => setDropTarget(null)}
            onDrop={(e) => {
                e.preventDefault();
                handleDrop();
            }}
        >
            <div className="editor-preview-toolbar">
                <div className="device-switch">
                    {devices.map((d) => (
                        <button
                            key={d.id}
                            type="button"
                            className={`device-switch-item${device === d.id ? ' active' : ''}`}
                            onClick={() => onDeviceChange(d.id)}
                            title={d.label}
                        >
                            <d.Icon size={15} strokeWidth={1.75}/>
                            <span>{d.label}</span>
                        </button>
                    ))}
                </div>
                {deviceWidth != null && (
                    <span className="device-width-hint">{deviceWidth}px</span>
                )}
                <div className="editor-preview-toolbar-actions">
                    <button
                        type="button"
                        className="icon-btn"
                        onClick={onUndo}
                        disabled={!canUndo}
                        title="Undo"
                        aria-label="Undo"
                    >
                        <UI.UndoArrow size={16} strokeWidth={1.75}/>
                    </button>
                    <button
                        type="button"
                        className="icon-btn"
                        onClick={onRedo}
                        disabled={!canRedo}
                        title="Redo"
                        aria-label="Redo"
                    >
                        <UI.RedoArrow size={16} strokeWidth={1.75}/>
                    </button>
                    <button
                        className="btn-save"
                        onClick={onSave}
                        disabled={!isDirty}
                    >
                        <UI.Save size={14} strokeWidth={2}/>
                        Save
                    </button>
                    <span className="btn-tooltip-wrap">
                <button
                    className={`btn-save btn-push${canPush && !isPushing ? ' is-ready' : ''}`}
                    onClick={onPush}
                    disabled={isPushing || !canPush}
                >
                  {isPushing ? 'Pushing…' : 'Push'}
                </button>
                <span className="btn-tooltip" role="tooltip">
                  {canPush ? 'Push all changes to production' : 'Nothing to push'}
                </span>
              </span>
                </div>
            </div>
            {device === 'desktop' ? (
                <div
                    className="editor-preview-inner"
                    ref={innerRef}
                >
                    {renderContent()}
                </div>
            ) : (
                <DeviceFrame
                    device={device}
                    width={deviceWidth}
                    pageData={pageData}
                    footerData={footerData}
                    selectedBlockId={selectedBlockId}
                    hoveredTreeId={hoveredTreeId}
                    onSelectFromFrame={onSelectFromFrame}
                    onDeleteFromFrame={onDeleteFromFrame}
                    onDuplicateFromFrame={onDuplicateFromFrame}
                    onUpdatePropFromFrame={onUpdatePropFromFrame}
                />
            )}
        </div>
    );
}

function DeviceFrame({
                         device,
                         width,
                         pageData,
                         footerData,
                         selectedBlockId,
                         hoveredTreeId,
                         onSelectFromFrame,
                         onDeleteFromFrame,
                         onDuplicateFromFrame,
                         onUpdatePropFromFrame
                     }) {
    const iframeRef = useRef(null);
    const readyRef = useRef(false);

    const postData = useCallback(() => {
        const win = iframeRef.current?.contentWindow;
        if (!win || !readyRef.current) return;
        win.postMessage(
            {type: 'pageData', pageData, footerData, selectedId: selectedBlockId, hoveredId: hoveredTreeId},
            '*'
        );
    }, [pageData, footerData, selectedBlockId, hoveredTreeId]);

    useEffect(() => {
        const onMessage = (e) => {
            if (e.source !== iframeRef.current?.contentWindow) return;
            const msg = e.data;
            if (!msg || typeof msg !== 'object') return;
            if (msg.type === 'frame-ready') {
                readyRef.current = true;
                postData();
            } else if (msg.type === 'select' && onSelectFromFrame) {
                onSelectFromFrame(msg.id);
            } else if (msg.type === 'delete' && onDeleteFromFrame) {
                onDeleteFromFrame(msg.id);
            } else if (msg.type === 'duplicate' && onDuplicateFromFrame) {
                onDuplicateFromFrame(msg.id);
            } else if (msg.type === 'updateProp' && onUpdatePropFromFrame) {
                onUpdatePropFromFrame(msg.id, msg.key, msg.value);
            }
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [postData, onSelectFromFrame, onDeleteFromFrame, onDuplicateFromFrame, onUpdatePropFromFrame]);

    useEffect(() => {
        postData();
    }, [postData]);

    return (
        <div className="device-frame">
            <iframe
                ref={iframeRef}
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
