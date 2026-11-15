import {useState, useCallback, useEffect, useRef} from 'react';
import {AREAS, PAGE_AREA} from '../lib/areas.js';
import {pendingBlobUrls, uploadPending, withUploadedUrls} from '../lib/pendingUploads.js';
import {docEndpoint, isRouteId} from '../lib/docView.js';

export function useSavePush({
                                currentPageId,
                                areas,
                                dirty,
                                markSaved,
                                showToast,
                            }) {
    const [isSaving, setIsSaving] = useState(false);
    const [saveRun, setSaveRun] = useState(null);
    const [canPush, setCanPush] = useState(false);
    const [pushPreview, setPushPreview] = useState({commits: [], error: null});
    const [saveLock, setSaveLock] = useState({disabled: false, tooltip: null});
    useEffect(() => {
        fetch('/api/editor/config', {cache: 'no-store'})
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data?.save) setSaveLock({disabled: !!data.save.disabled, tooltip: data.save.tooltip || null});
            })
            .catch(() => {});
    }, []);
    const refreshSeqRef = useRef(0);
    const refreshPushStatus = useCallback(async () => {
        const seq = ++refreshSeqRef.current;
        try {
            const res = await fetch('/api/editor/push/status', {cache: 'no-store'});
            if (!res.ok || seq !== refreshSeqRef.current) return;
            const data = await res.json();
            if (seq !== refreshSeqRef.current) return;
            setCanPush(!!data.canPush);
            const next = {commits: data.commits || [], error: data.error || null};
            setPushPreview((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
        } catch {
        }
    }, []);
    useEffect(() => {
        refreshPushStatus();
        const t = setInterval(refreshPushStatus, 10_000);
        return () => clearInterval(t);
    }, [refreshPushStatus]);

    const publish = useCallback(async () => {
        const res = await fetch('/api/editor/push', {method: 'POST'});
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
            const detail = (data.steps || [])
                .filter((s) => s.code !== 0 || s.stderr)
                .map((s) => `[${s.step}] ${s.stderr || s.error || `exit ${s.code}`}`)
                .join('\n');
            throw new Error(detail || data.error || 'unknown error');
        }
    }, []);

    const pendingLabels = AREAS.filter((a) => dirty[a.key]).map((a) => (a.key === PAGE_AREA && isRouteId(currentPageId) ? 'Storefront page blocks' : a.label));

    // One pass over the region list: every dirty area is written to its own
    // page file, the page area to whichever page is currently open. The commit
    // each write leaves behind is then published, so Save is the only step.
    const save = useCallback(async () => {
        if (isSaving || saveLock.disabled) return;
        const targets = AREAS
            .filter((area) => dirty[area.key])
            .map((area) => ({area, id: area.key === PAGE_AREA ? currentPageId : area.pageId, value: areas[area.key]}))
            .filter((t) => t.id);
        const blobs = pendingBlobUrls(targets.map((t) => t.value));
        const steps = [
            ...(blobs.length ? [{key: 'upload', label: 'Uploading images', done: 0, total: blobs.length}] : []),
            {key: 'save', label: targets.length ? `Saving & committing ${targets.map((t) => `"${t.area.label}"`).join(', ')}` : 'Saving & committing'},
            {key: 'publish', label: 'Publishing'},
        ].map((step) => ({...step, status: 'pending', error: ''}));
        const update = (key, patch) => setSaveRun((run) => run && {
            ...run,
            steps: run.steps.map((step) => (step.key === key ? {...step, ...patch} : step)),
        });
        const fail = (key, message) => {
            update(key, {status: 'error', error: message});
            setSaveRun((run) => run && {...run, status: 'error'});
            showToast(message, 'error', 7000);
        };

        setIsSaving(true);
        setSaveRun({status: 'running', steps});
        const broadcast = (() => {
            try {
                return new BroadcastChannel('editor:pages');
            } catch {
                return null;
            }
        })();
        try {
            if (blobs.length) {
                update('upload', {status: 'active'});
                try {
                    for (let i = 0; i < blobs.length; i++) {
                        await uploadPending(blobs[i]);
                        update('upload', {done: i + 1});
                    }
                } catch (err) {
                    fail('upload', `Images were not uploaded: ${err.message}`);
                    return;
                }
                update('upload', {status: 'done'});
            }

            update('save', {status: 'active'});
            const refused = [];
            for (const {area, id, value} of targets) {
                const body = withUploadedUrls(value);
                const res = await fetch(docEndpoint(id), {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(body),
                }).catch((err) => ({ok: false, json: async () => ({error: err.message})}));
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    refused.push(`"${area.label}" was not saved: ${data.error || `request failed (${res.status})`}`);
                    continue;
                }
                markSaved(area.key, JSON.stringify(value));
                broadcast?.postMessage({type: 'saved', id, path: body?.path});
            }
            if (refused.length) fail('save', refused.join('\n'));
            else update('save', {status: 'done'});

            update('publish', {status: 'active'});
            try {
                await publish();
            } catch (err) {
                fail('publish', `Saved locally — publish failed: ${err.message}`);
                return;
            }
            update('publish', {status: 'done'});
            if (!refused.length) setSaveRun((run) => run && {...run, status: 'done'});
        } finally {
            broadcast?.close?.();
            setIsSaving(false);
            refreshPushStatus();
        }
    }, [currentPageId, areas, dirty, isSaving, saveLock.disabled, markSaved, publish, refreshPushStatus, showToast]);

    return {
        isSaving, saveRun, canPush, pushPreview, pendingLabels, save, refreshPushStatus,
        saveDisabled: saveLock.disabled, saveTooltip: saveLock.tooltip,
    };
}
