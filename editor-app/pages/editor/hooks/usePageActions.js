import {useState, useCallback, useEffect} from 'react';
import {toRouteId} from '../lib/docView.js';

export function usePageActions({
                                   currentPageId,
                                   setCurrentPageId,
                                   wouldDiscard,
                                   applyPageMeta,
                                   showToast,
                                   refreshPushStatus,
                               }) {
    const [pages, setPages] = useState([]);
    const [pendingSwitchId, setPendingSwitchId] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);

    const refreshPages = useCallback(async () => {
        const [pageList, routeList] = await Promise.all([
            fetch('/api/editor/pages', {cache: 'no-store'}).then((r) => r.json()).catch(() => []),
            fetch('/api/editor/routes', {cache: 'no-store'}).then((r) => r.json()).catch(() => []),
        ]);
        const list = [
            ...pageList.map((p) => ({...p, kind: 'page'})),
            ...routeList.map((r) => ({...r, id: toRouteId(r.id), kind: 'route'})),
        ];
        setPages(list);
        return list;
    }, []);

    useEffect(() => {
        refreshPages();
    }, [refreshPages]);

    const request = useCallback(async (url, options) => {
        let res;
        try {
            res = await fetch(url, options);
        } catch (err) {
            return {error: err.message || 'Request failed'};
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return {error: data.error || `Request failed (${res.status})`};
        return {data};
    }, []);

    const jsonBody = (body) => ({
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
    });

    const reportPublish = useCallback((data, done) => {
        if (data?.publishError) showToast(`${done} — publish failed: ${data.publishError}`, 'error', 7000);
        else showToast(`${done} and published`, 'success');
    }, [showToast]);

    const afterMutation = useCallback(async () => {
        await refreshPages();
        refreshPushStatus?.();
    }, [refreshPages, refreshPushStatus]);

    const requestPageChange = useCallback((id) => {
        if (!id || id === currentPageId) return;
        if (wouldDiscard(id)) {
            setPendingSwitchId(id);
            return;
        }
        setCurrentPageId(id);
    }, [currentPageId, wouldDiscard, setCurrentPageId]);

    const confirmPageChange = useCallback(() => {
        if (pendingSwitchId) setCurrentPageId(pendingSwitchId);
        setPendingSwitchId(null);
    }, [pendingSwitchId, setCurrentPageId]);

    const createPage = useCallback(async ({title, path}) => {
        const res = await request('/api/editor/pages', {method: 'POST', ...jsonBody({title, path})});
        if (res.error) return res;
        await afterMutation();
        reportPublish(res.data, `Page "${res.data.title}" created`);
        requestPageChange(res.data.id);
        return {ok: true};
    }, [request, afterMutation, reportPublish, requestPageChange]);

    const updatePage = useCallback(async (id, {title, path, hidden}) => {
        const res = await request(`/api/editor/pages/${id}`, {method: 'PATCH', ...jsonBody({title, path, hidden})});
        if (res.error) return res;
        await afterMutation();
        if (id === currentPageId) {
            applyPageMeta({title: res.data.title, path: res.data.path, hidden: res.data.hidden});
        }
        reportPublish(res.data, `Page "${res.data.title}" updated`);
        return {ok: true};
    }, [request, afterMutation, reportPublish, currentPageId, applyPageMeta]);

    const togglePageHidden = useCallback(async (page) => {
        const res = await request(`/api/editor/pages/${page.id}`, {
            method: 'PATCH',
            ...jsonBody({hidden: !page.hidden}),
        });
        if (res.error) {
            showToast(res.error, 'error', 6000);
            return {error: res.error};
        }
        await afterMutation();
        if (page.id === currentPageId) applyPageMeta({hidden: res.data.hidden});
        reportPublish(res.data, `Page "${res.data.title}" ${res.data.hidden ? 'hidden' : 'shown'}`);
        return {ok: true};
    }, [request, afterMutation, reportPublish, showToast, currentPageId, applyPageMeta]);

    const duplicatePage = useCallback(async (id, {title, path}) => {
        const res = await request(`/api/editor/pages/${id}/duplicate`, {method: 'POST', ...jsonBody({title, path})});
        if (res.error) return res;
        await afterMutation();
        reportPublish(res.data, `Page "${res.data.title}" created`);
        requestPageChange(res.data.id);
        return {ok: true};
    }, [request, afterMutation, reportPublish, requestPageChange]);

    const confirmDelete = useCallback(async () => {
        const page = pendingDelete;
        setPendingDelete(null);
        if (!page) return;
        const res = await request(`/api/editor/pages/${page.id}`, {method: 'DELETE'});
        if (res.error) {
            showToast(res.error, 'error', 6000);
            return;
        }
        const list = await refreshPages();
        refreshPushStatus?.();
        reportPublish(res.data, `Page "${page.title}" deleted`);
        if (page.id === currentPageId) {
            const regular = list.filter((p) => p.kind === 'page' && !p.id.startsWith('__'));
            const next = regular.find((p) => p.path === '/') || regular[0];
            if (next) setCurrentPageId(next.id);
        }
    }, [pendingDelete, request, refreshPages, refreshPushStatus, reportPublish, showToast, currentPageId, setCurrentPageId]);

    return {
        pages,
        refreshPages,
        requestPageChange,
        pendingSwitchId,
        cancelPageChange: () => setPendingSwitchId(null),
        confirmPageChange,
        createPage,
        updatePage,
        duplicatePage,
        togglePageHidden,
        requestPageDelete: setPendingDelete,
        pendingDelete,
        cancelDelete: () => setPendingDelete(null),
        confirmDelete,
    };
}
