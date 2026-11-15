import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {UI} from '../../src/editor/Icon.jsx';
import {iconBtn, fieldInput} from './lib/cls.js';
import {ConfirmModal} from './ConfirmModal.jsx';

const btn =
    'h-8 px-3.5 text-[12.5px] font-medium rounded [font-family:inherit] cursor-pointer [transition:all_0.1s] border border-solid ' +
    'disabled:opacity-60 disabled:cursor-default';
const btnGhost = `${btn} bg-ed-surface text-ed-text border-ed-border enabled:hover:border-ed-primary enabled:hover:text-ed-primary enabled:hover:bg-ed-primary-soft`;
const btnPrimary = `${btn} bg-ed-primary border-ed-primary text-white enabled:hover:bg-ed-primary-dark enabled:hover:border-ed-primary-dark`;

const isIp = (s) => /^(\d{1,3}\.){3}\d{1,3}$/.test(s) || (s.includes(':') && /^[0-9a-f:.]+$/i.test(s));

export function SiteSettingsModal({open, settings, onClose, onSave}) {
    const dialogRef = useRef(null);
    const [tab, setTab] = useState('maintenance');
    const [ipsText, setIpsText] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [confirmOn, setConfirmOn] = useState(false);

    useEffect(() => {
        if (open) setIpsText((settings?.maintenance?.allowedIps || []).map((e) => e.ip).join('\n'));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, settings]);

    useEffect(() => {
        if (!open) return undefined;
        setError('');
        setConfirmOn(false);
        dialogRef.current?.focus();
        const onKey = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
            }
        };
        document.addEventListener('keydown', onKey, true);
        return () => document.removeEventListener('keydown', onKey, true);
    }, [open, onClose]);

    if (!open || typeof document === 'undefined') return null;
    const host = document.querySelector('.editor-root');
    if (!host) return null;

    const maintenance = settings?.maintenance || {enabled: false, allowedIps: []};
    const allowed = maintenance.allowedIps || [];
    const savedIpsText = allowed.map((e) => e.ip).join('\n');
    const ipsDirty = ipsText.trim() !== savedIpsText.trim();

    const save = async (next) => {
        setBusy(true);
        setError('');
        try {
            await onSave({maintenance: {...maintenance, ...next}});
        } catch (err) {
            setError(err.message || 'Could not save the settings.');
        } finally {
            setBusy(false);
        }
    };

    const saveIps = async () => {
        const lines = ipsText.split(/[\s,]+/).map((l) => l.trim()).filter(Boolean);
        const bad = lines.find((l) => !isIp(l));
        if (bad) {
            setError(`"${bad}" is not an IP address.`);
            return;
        }
        await save({allowedIps: [...new Set(lines)].map((v) => ({ip: v, label: ''}))});
    };

    return createPortal(
        <div
            className="site-settings-overlay fixed inset-0 z-[200] bg-[rgba(0,0,0,0.4)] flex items-center justify-center"
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
        >
            <div
                ref={dialogRef}
                tabIndex={-1}
                className="site-settings w-[760px] max-w-[calc(100vw-48px)] max-h-[80vh] flex flex-col px-6 py-5 bg-ed-surface border border-solid border-ed-border rounded-lg shadow-ed-pop text-left"
                role="dialog"
                aria-modal="true"
                aria-label="Site settings"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-solid border-ed-border">
                    <span className="text-[15px] font-semibold text-ed-text">Site settings</span>
                    <button type="button" className={iconBtn} onClick={onClose} aria-label="Close">
                        <UI.Close size={16} strokeWidth={2}/>
                    </button>
                </div>

                <div className="flex gap-5 min-h-0">
                <div className="flex flex-col gap-1 w-[150px] shrink-0 pr-4 border-r border-solid border-ed-border" role="tablist" aria-orientation="vertical">
                    {[{id: 'maintenance', label: 'Maintenance'}].map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            role="tab"
                            aria-selected={tab === t.id}
                            className={`h-8 px-3 rounded border border-solid text-left text-[12.5px] font-medium cursor-pointer ${tab === t.id ? 'bg-ed-primary-soft text-ed-primary border-ed-primary' : 'bg-transparent text-ed-text-muted border-transparent hover:text-ed-text hover:bg-ed-surface-hover'}`}
                            onClick={() => setTab(t.id)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {tab === 'maintenance' && (
                    <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto" role="tabpanel">
                        <div className="flex items-center gap-3 px-3 py-2 rounded border border-solid border-ed-border">
                            <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-semibold text-ed-text">
                                    {!settings ? 'Loading…' : <>Maintenance mode is {maintenance.enabled ? <span className="text-ed-danger">on</span> : 'off'}</>}
                                </div>
                            </div>
                            {!settings ? null : maintenance.enabled ? (
                                <button type="button" className={btnPrimary} disabled={busy} onClick={() => save({enabled: false})}>
                                    Turn off
                                </button>
                            ) : (
                                <button type="button" className={btnGhost} disabled={busy} onClick={() => setConfirmOn(true)}>
                                    Turn on
                                </button>
                            )}
                        </div>


                        <div>
                            <label htmlFor="maintenance-ips" className="block mb-2 text-[13px] font-semibold text-ed-text">Allowed IP addresses</label>
                            <textarea
                                id="maintenance-ips"
                                className={`${fieldInput} h-auto min-h-[96px] py-[7px] resize-y font-ed-mono leading-[1.5]`}
                                rows={4}
                                placeholder={'203.0.113.10\n198.51.100.7'}
                                value={ipsText}
                                onChange={(e) => setIpsText(e.target.value)}
                            />
                            <div className="flex justify-end mt-2">
                                <button type="button" className={btnPrimary} disabled={busy || !ipsDirty} onClick={saveIps}>Save</button>
                            </div>
                        </div>

                        {error && <div className="text-[12px] text-ed-danger" role="alert">{error}</div>}
                    </div>
                )}
                </div>
            </div>
            <ConfirmModal
                open={confirmOn}
                title="Turn on maintenance mode"
                message="Close the site for visitors?"
                detail="Everyone except the allowed IP addresses will see the maintenance page until you turn it off."
                confirmLabel="Turn on"
                danger
                onClose={() => setConfirmOn(false)}
                onConfirm={() => save({enabled: true}).then(() => setConfirmOn(false))}
            />
        </div>,
        host
    );
}
