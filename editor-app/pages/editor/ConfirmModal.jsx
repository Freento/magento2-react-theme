import {useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';
import {UI} from '../../src/editor/Icon.jsx';
import {iconBtn} from './lib/cls.js';

const modalBtn =
    'confirm-modal-btn h-8 px-4 text-[12.5px] font-medium rounded [font-family:inherit] cursor-pointer ' +
    '[transition:all_0.1s] border border-solid';
const modalBtnGhost =
    `${modalBtn} bg-ed-surface text-ed-text border-ed-border hover:border-ed-primary hover:text-ed-primary hover:bg-ed-primary-soft`;
const modalBtnPrimary =
    `${modalBtn} bg-ed-primary border-ed-primary text-white hover:bg-ed-primary-dark hover:border-ed-primary-dark`;
const modalBtnDanger =
    `${modalBtn} confirm-modal-btn--danger bg-ed-danger border-ed-danger text-white hover:opacity-90`;

export function ConfirmModal({
                                 open,
                                 title,
                                 message,
                                 detail,
                                 confirmLabel = 'Confirm',
                                 cancelLabel = 'Cancel',
                                 danger = false,
                                 onClose,
                                 onConfirm,
                             }) {
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

    return createPortal(
        <div
            className="confirm-modal-overlay fixed inset-0 z-[200] bg-[rgba(0,0,0,0.4)] flex items-center justify-center"
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
        >
            <div
                ref={dialogRef}
                tabIndex={-1}
                className="confirm-modal w-[440px] max-w-[calc(100vw-48px)] flex flex-col px-6 py-5 bg-ed-surface border border-solid border-ed-border rounded-lg shadow-ed-pop text-left"
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="confirm-modal-header flex items-center justify-between mb-3 pb-3 border-b border-solid border-ed-border">
                    <span className="confirm-modal-title text-[15px] font-semibold text-ed-text">{title}</span>
                    <button type="button" className={iconBtn} onClick={onClose} aria-label="Close">
                        <UI.Close size={16} strokeWidth={2}/>
                    </button>
                </div>
                <div className="confirm-modal-body text-[12.5px] leading-[1.5] text-ed-text mb-4">
                    {message}
                    {detail && (
                        <div className="confirm-modal-detail mt-2 text-[12px] text-ed-text-muted">{detail}</div>
                    )}
                </div>
                <div className="confirm-modal-actions flex justify-end gap-2">
                    <button type="button" className={modalBtnGhost} onClick={onClose}>
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={danger ? modalBtnDanger : modalBtnPrimary}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        host
    );
}
