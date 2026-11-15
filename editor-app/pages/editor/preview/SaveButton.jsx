import {useEffect, useState} from 'react';
import {UI} from '../../../src/editor/Icon.jsx';
import {btnSave} from '../lib/cls.js';

const spinner = 'inline-block shrink-0 rounded-full border-2 border-current border-t-transparent animate-[spin_0.8s_linear_infinite]';

const activeLabel = (run) => {
    const step = run?.steps.find((s) => s.status === 'active');
    if (!step) return 'Saving…';
    if (step.key === 'upload') return `Uploading ${step.done}/${step.total}…`;
    if (step.key === 'publish') return 'Publishing…';
    return 'Saving…';
};

function StepIcon({status}) {
    if (status === 'done') return <UI.Check size={14} strokeWidth={2.5} className="shrink-0 text-ed-primary"/>;
    if (status === 'error') return <UI.Warning size={14} strokeWidth={2} className="shrink-0 text-ed-danger"/>;
    if (status === 'active') return <span className={`${spinner} h-3.5 w-3.5 text-ed-primary`}/>;
    return <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center"><span className="h-1.5 w-1.5 rounded-full bg-ed-border"/></span>;
}

export function SaveButton({disabled, isSaving, saveRun, onClick, onRetry}) {
    const [justSaved, setJustSaved] = useState(false);

    useEffect(() => {
        if (saveRun?.status !== 'done') return undefined;
        setJustSaved(true);
        const t = setTimeout(() => setJustSaved(false), 2500);
        return () => clearTimeout(t);
    }, [saveRun]);

    const failed = saveRun?.status === 'error' && !isSaving;
    const title = isSaving ? 'Saving' : failed ? 'Save failed' : 'Last save';

    return (
        <div className="save-button group/save relative">
            <button
                className={`${btnSave}${failed ? ' !bg-ed-danger enabled:hover:!bg-ed-danger' : ''}`}
                onClick={onClick}
                disabled={isSaving || disabled}
                aria-busy={isSaving}
            >
                {isSaving
                    ? <span className={`${spinner} h-3.5 w-3.5`}/>
                    : failed
                        ? <UI.Warning size={14} strokeWidth={2}/>
                        : justSaved
                            ? <UI.Check size={14} strokeWidth={2.5}/>
                            : <UI.Save size={14} strokeWidth={2}/>}
                {isSaving ? activeLabel(saveRun) : failed ? 'Save failed' : justSaved ? 'Saved' : 'Save'}
            </button>
            {saveRun && (
                <div className="save-steps absolute right-0 top-full z-[30] hidden pt-2 group-hover/save:block group-focus-within/save:block">
                    <div className="w-[300px] rounded border border-solid border-ed-border bg-ed-surface p-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)]" role="status" aria-live="polite">
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ed-text-muted">{title}</div>
                        <ul className="m-0 flex list-none flex-col gap-2 p-0">
                            {saveRun.steps.map((step) => (
                                <li key={step.key} className="flex flex-col gap-1">
                                    <div className={`flex items-center gap-2 text-[12.5px] ${step.status === 'pending' ? 'text-ed-text-muted' : 'text-ed-text'}`}>
                                        <StepIcon status={step.status}/>
                                        <span className="min-w-0 flex-1 truncate" title={step.label}>{step.label}</span>
                                        {step.key === 'upload' && <span className="font-ed-mono text-[11.5px] text-ed-text-muted">{step.done}/{step.total}</span>}
                                    </div>
                                    {step.error && (
                                        <div className="whitespace-pre-line break-words rounded bg-ed-danger-soft px-2 py-1 text-[11.5px] leading-[1.4] text-ed-danger">{step.error}</div>
                                    )}
                                </li>
                            ))}
                        </ul>
                        {failed && (
                            <button
                                type="button"
                                className={`${btnSave} mt-3 w-full justify-center`}
                                onClick={onRetry}
                            >
                                <UI.Refresh size={14} strokeWidth={2}/>
                                Retry
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
