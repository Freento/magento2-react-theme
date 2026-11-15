import {useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';
import {UI} from '../../src/editor/Icon.jsx';
import {iconBtn} from './lib/cls.js';

const saveModalBtn =
    'save-modal-btn h-8 px-4 text-[12.5px] font-medium rounded [font-family:inherit] cursor-pointer [transition:all_0.1s] ' +
    'border border-solid';
const saveModalBtnGhost =
    `${saveModalBtn} bg-ed-surface text-ed-text border-ed-border hover:border-ed-primary hover:text-ed-primary hover:bg-ed-primary-soft`;
const saveModalBtnPrimary =
    `${saveModalBtn} save-modal-btn--primary bg-ed-primary border-ed-primary text-white ` +
    'enabled:hover:bg-ed-primary-dark enabled:hover:border-ed-primary-dark ' +
    'disabled:bg-ed-border disabled:border-ed-border disabled:text-ed-text-soft disabled:cursor-default';

export function SaveConfirmModal({open, pending, preview, onClose, onConfirm}) {
    const dialogRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        dialogRef.current?.focus();
        const onKey = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
                return;
            }
            if (e.key !== 'Tab') return;
            const nodes = [...(dialogRef.current?.querySelectorAll('button:not(:disabled)') || [])];
            if (!nodes.length) return;
            const first = nodes[0];
            const last = nodes[nodes.length - 1];
            if (!dialogRef.current.contains(document.activeElement)) {
                e.preventDefault();
                first.focus();
            } else if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', onKey, true);
        return () => document.removeEventListener('keydown', onKey, true);
    }, [open, onClose]);

    if (!open || typeof document === 'undefined') return null;
    const host = document.querySelector('.editor-root');
    if (!host) return null;

    const edits = pending || [];
    const commits = preview?.commits || [];
    const statusBroken = !!preview?.error;
    const rows = [
        ...edits.map((label) => `${label} — unsaved edits`),
        ...commits,
    ];
    const total = rows.length;

    return createPortal(
        <div
            className="save-modal-overlay fixed inset-0 z-[200] bg-[rgba(0,0,0,0.4)] flex items-center justify-center"
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
        >
            <div
                ref={dialogRef}
                tabIndex={-1}
                className="save-modal w-[560px] max-w-[calc(100vw-48px)] max-h-[80vh] flex flex-col px-6 py-5 bg-ed-surface border border-solid border-ed-border rounded-lg shadow-ed-pop text-left"
                role="dialog"
                aria-modal="true"
                aria-label="Review changes before publishing"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="save-modal-header flex items-center justify-between mb-3 pb-3 border-b border-solid border-ed-border">
                    <span className="save-modal-title text-[15px] font-semibold text-ed-text">Publish changes</span>
                    <button type="button" className={iconBtn} onClick={onClose} aria-label="Close">
                        <UI.Close size={16} strokeWidth={2}/>
                    </button>
                </div>
                <div className="save-modal-callout flex items-center gap-2 px-3 py-[9px] mb-3 bg-ed-primary-soft border border-solid border-[rgba(15,76,92,0.25)] rounded text-[12.5px] font-medium text-ed-primary [&_svg]:shrink-0">
                    <UI.Warning size={15} strokeWidth={1.75}/>
                    These changes will go live on the production site.
                </div>
                {statusBroken && (
                    <div className="save-modal-empty text-[12.5px] text-ed-text-muted mb-3.5">
                        Couldn't read earlier unpublished changes — check git on the server.
                    </div>
                )}
                {total > 0 ? (
                    <ul className="save-modal-list mb-4 py-0.5 list-none overflow-y-auto">
                        {rows.map((msg, i) => (
                            // Timeline row: ::before dot, ::after connecting rail.
                            <li
                                key={i}
                                className={
                                    'relative py-1.5 pl-6 text-[12.5px] leading-[1.45] text-ed-text ' +
                                    "before:content-[''] before:absolute before:left-1 before:top-[11px] before:w-[7px] before:h-[7px] " +
                                    'before:rounded-full before:bg-ed-primary before:shadow-[0_0_0_2px_#fff] before:z-[1] ' +
                                    "after:content-[''] after:absolute after:left-[7px] after:top-0 after:bottom-0 after:w-px after:bg-ed-border-strong " +
                                    'first:after:top-3.5 last:after:bottom-[calc(100%-14px)] only:after:hidden'
                                }
                            >{msg}</li>
                        ))}
                    </ul>
                ) : (
                    <div className="save-modal-empty text-[12.5px] text-ed-text-muted mb-3.5">Nothing to publish.</div>
                )}
                <div className="save-modal-actions flex justify-end gap-2">
                    <button type="button" className={saveModalBtnGhost} onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className={saveModalBtnPrimary}
                        disabled={total === 0}
                        onClick={onConfirm}
                    >
                        Publish {total} change{total === 1 ? '' : 's'}
                    </button>
                </div>
            </div>
        </div>,
        host
    );
}
