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
            className="editor-preview flex flex-col flex-1 overflow-auto bg-e-bg relative z-0"
            onClick={(e) => {
                if (!e.target?.closest?.('[data-block-id]')) onDeselect?.();
            }}
            onClickCapture={(e) => {
                if (typeof window !== 'undefined' && window.__editorPicking) return;
                const link = e.target.closest && e.target.closest('a');
                if (!link) return;
                // A container can be a link, and then every block inside it sits
                // inside an anchor too. Selecting the nested block is what the
                // author means by clicking it, so only a click on the block that
                // owns the link follows it. Its own wrapper is outside the
                // anchor; a nested block's is inside.
                const hit = e.target.closest && e.target.closest('[data-block-id]');
                if (hit && link.contains(hit)) return;
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
            <div className="editor-preview-toolbar sticky top-0 z-[5] flex items-center gap-2.5 justify-center py-2 px-3 bg-e-code-bg border-b border-e-border">
                <div className="device-switch inline-flex bg-e-surface border border-e-border rounded-e p-[3px] gap-0.5">
                    {devices.map((d) => (
                        <button
                            key={d.id}
                            type="button"
                            className={`device-switch-item inline-flex items-center gap-1.5 py-1 px-2.5 h-7 border-none bg-transparent text-e-text-muted text-[12px] font-medium rounded-e-sm cursor-pointer transition-all duration-100 [&:hover:not(.active)]:text-e-text [&:hover:not(.active)]:bg-e-code-bg [&.active]:text-e-text [&.active]:bg-e-primary-soft [&.active]:shadow-[0_0_0_1px_#0F4C5C]${device === d.id ? ' active' : ''}`}
                            onClick={() => onDeviceChange(d.id)}
                            title={d.label}
                        >
                            <d.Icon size={15} strokeWidth={1.75}/>
                            <span>{d.label}</span>
                        </button>
                    ))}
                </div>
                {deviceWidth != null && (
                    <span className="device-width-hint text-[11px] text-e-text-soft [font-family:'SF_Mono',ui-monospace,Menlo,monospace]">{deviceWidth}px</span>
                )}
                <div className="editor-preview-toolbar-actions absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                        type="button"
                        className="icon-btn w-7 h-7 inline-flex items-center justify-center border border-transparent bg-transparent text-e-text-muted rounded-e cursor-pointer transition-all duration-100 flex-shrink-0 enabled:hover:bg-e-surface-hover enabled:hover:text-e-text enabled:hover:border-e-border disabled:opacity-[0.35] disabled:cursor-not-allowed"
                        onClick={onUndo}
                        disabled={!canUndo}
                        title="Undo"
                        aria-label="Undo"
                    >
                        <UI.UndoArrow size={16} strokeWidth={1.75}/>
                    </button>
                    <button
                        type="button"
                        className="icon-btn w-7 h-7 inline-flex items-center justify-center border border-transparent bg-transparent text-e-text-muted rounded-e cursor-pointer transition-all duration-100 flex-shrink-0 enabled:hover:bg-e-surface-hover enabled:hover:text-e-text enabled:hover:border-e-border disabled:opacity-[0.35] disabled:cursor-not-allowed"
                        onClick={onRedo}
                        disabled={!canRedo}
                        title="Redo"
                        aria-label="Redo"
                    >
                        <UI.RedoArrow size={16} strokeWidth={1.75}/>
                    </button>
                    <button
                        className="btn-save h-8 px-[14px] text-[13px] font-medium border border-transparent rounded-e cursor-pointer transition-all duration-100 text-white bg-e-text inline-flex items-center gap-1.5 whitespace-nowrap enabled:hover:bg-e-text-hover disabled:bg-e-border disabled:text-e-text-soft disabled:cursor-default"
                        onClick={onSave}
                        disabled={!isDirty}
                    >
                        <UI.Save size={14} strokeWidth={2}/>
                        Save
                    </button>
                    <span className="btn-tooltip-wrap relative inline-flex group">
                <button
                    className={`btn-save btn-push h-8 px-[14px] text-[13px] font-medium border rounded-e cursor-pointer transition-all duration-100 inline-flex items-center gap-1.5 whitespace-nowrap bg-transparent text-e-text-soft border-e-border [&.is-ready]:bg-e-text [&.is-ready]:text-white [&.is-ready]:border-e-text [&.is-ready]:enabled:hover:bg-e-text-hover disabled:bg-transparent disabled:text-e-text-soft disabled:border-e-border disabled:cursor-default${canPush && !isPushing ? ' is-ready' : ''}`}
                    onClick={onPush}
                    disabled={isPushing || !canPush}
                >
                  {isPushing ? 'Pushing…' : 'Push'}
                </button>
                <span className="btn-tooltip absolute top-[calc(100%+8px)] right-0 z-50 py-1.5 px-2.5 bg-e-text text-white text-[12px] font-medium leading-[1.3] whitespace-nowrap rounded-e shadow-e-pop opacity-0 pointer-events-none translate-y-[-2px] transition-[opacity,transform] duration-[120ms] group-hover:opacity-100 group-hover:translate-y-0 before:content-[''] before:absolute before:top-[-4px] before:right-[14px] before:w-2 before:h-2 before:bg-e-text before:rotate-45 before:rounded-[1px]" role="tooltip">
                  {canPush ? 'Push all changes to production' : 'Nothing to push'}
                </span>
              </span>
                </div>
            </div>
            {device === 'desktop' ? (
                <div
                    className="editor-preview-inner bg-e-surface min-h-full"
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
        <div className="device-frame flex-1 flex flex-col items-center p-4 min-h-0 gap-2.5 overflow-auto [&_iframe]:flex-shrink-0 [&_iframe]:rounded-e-lg [&_iframe]:shadow-[0_4px_24px_rgba(0,0,0,0.08)] [&_iframe]:bg-e-surface [&_iframe]:block [&_iframe]:h-[calc(100vh-52px-32px)] [&_iframe]:max-h-full">
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
