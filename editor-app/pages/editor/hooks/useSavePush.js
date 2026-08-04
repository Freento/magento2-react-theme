import {useState, useCallback, useEffect} from 'react';

const FOOTER_PAGE_ID = '__footer__';

export function useSavePush({
                                currentPageId,
                                pageData,
                                footerData,
                                mainDirty,
                                footerDirty,
                                setSavedPageJson,
                                setSavedFooterJson,
                                showToast,
                            }) {
    const [isPushing, setIsPushing] = useState(false);
    const [canPush, setCanPush] = useState(false);
    const refreshPushStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/editor/push/status', {cache: 'no-store'});
            if (!res.ok) return;
            const data = await res.json();
            setCanPush(!!data.canPush);
        } catch {
        }
    }, []);
    useEffect(() => {
        refreshPushStatus();
        const t = setInterval(refreshPushStatus, 10_000);
        return () => clearInterval(t);
    }, [refreshPushStatus]);

    const save = useCallback(async () => {
        const broadcast = (() => {
            try {
                return new BroadcastChannel('editor:pages');
            } catch {
                return null;
            }
        })();
        try {
            if (mainDirty) {
                await fetch(`/api/editor/pages/${currentPageId}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(pageData),
                });
                setSavedPageJson(JSON.stringify(pageData));
                broadcast?.postMessage({type: 'saved', id: currentPageId, path: pageData?.path});
            }
            if (footerDirty) {
                await fetch(`/api/editor/pages/${FOOTER_PAGE_ID}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(footerData),
                });
                setSavedFooterJson(JSON.stringify(footerData));
                broadcast?.postMessage({type: 'saved', id: FOOTER_PAGE_ID, path: footerData?.path});
            }
        } finally {
            broadcast?.close?.();
            refreshPushStatus();
        }
    }, [currentPageId, pageData, footerData, mainDirty, footerDirty, refreshPushStatus]);

    const push = useCallback(async () => {
        if (isPushing) return;
        setIsPushing(true);
        try {
            const res = await fetch('/api/editor/push', {method: 'POST'});
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.ok) {
                const detail = (data.steps || [])
                    .filter((s) => s.code !== 0 || s.stderr)
                    .map((s) => `[${s.step}] ${s.stderr || s.error || `exit ${s.code}`}`)
                    .join('\n');
                showToast(`Push failed — ${detail || data.error || 'unknown error'}`, 'error', 7000);
            } else {
                showToast('Pushed to remote', 'success');
            }
        } catch (err) {
            showToast(`Push failed — ${err.message}`, 'error', 7000);
        } finally {
            setIsPushing(false);
            refreshPushStatus();
        }
    }, [isPushing, refreshPushStatus, showToast]);

    return {isPushing, canPush, save, push, refreshPushStatus};
}
