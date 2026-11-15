import {useState, useRef, useEffect, useCallback, useMemo} from 'react';
import {AREA_KEYS, GLOBAL_AREAS, PAGE_AREA, areaMap} from '../lib/areas.js';
import {useHistory} from './useHistory.js';
import {docEndpoint} from '../lib/docView.js';

// Holds the JSON of every editable region (the open page + the global blocks)
// in a single map keyed by area, so loading, dirty tracking, undo history and
// saving are written once instead of once per region. See lib/areas.js.
export function useAreas({currentPageId}) {
    const [data, setData] = useState(() => areaMap(null));
    const [savedJson, setSavedJson] = useState(() => areaMap(null));

    const setArea = useCallback((key, next) => {
        setData((prev) => ({
            ...prev,
            [key]: typeof next === 'function' ? next(prev[key]) : next,
        }));
    }, []);

    const markSaved = useCallback((key, json) => {
        setSavedJson((prev) => ({...prev, [key]: json}));
    }, []);

    const history = useHistory({data, setArea});
    const {skipHistoryRef, lastSnapshotRef, resetHistory} = history;

    // The page area follows the page picker; switching pages starts a fresh
    // history because the previous page's snapshots no longer apply.
    useEffect(() => {
        if (!currentPageId) return undefined;
        let cancelled = false;
        fetch(docEndpoint(currentPageId), {cache: 'no-store'})
            .then((r) => (r.ok ? r.json() : null))
            .then((loaded) => {
                if (cancelled || !loaded) return;
                skipHistoryRef.current[PAGE_AREA] = true;
                setArea(PAGE_AREA, loaded);
                markSaved(PAGE_AREA, JSON.stringify(loaded));
                resetHistory();
                lastSnapshotRef.current[PAGE_AREA] = null;
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [currentPageId]);

    // A global block whose own `__*__` page is open is emptied instead of
    // loaded, so the page being edited is not also drawn as surrounding chrome.
    const openGlobalKey = GLOBAL_AREAS.find((a) => a.pageId === currentPageId)?.key ?? null;
    const openGlobalRef = useRef(openGlobalKey);
    openGlobalRef.current = openGlobalKey;
    const loadedGlobalsRef = useRef(new Set());
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Each global block is fetched once and then edited in place from any page,
    // so switching pages never throws away unsaved edits in the other regions.
    // Opening a region's own page drops it back to "not loaded", which is what
    // makes it come back fresh once that page is closed again.
    useEffect(() => {
        for (const area of GLOBAL_AREAS) {
            if (area.key === openGlobalKey) {
                loadedGlobalsRef.current.delete(area.key);
                skipHistoryRef.current[area.key] = true;
                setArea(area.key, null);
                lastSnapshotRef.current[area.key] = null;
                continue;
            }
            if (loadedGlobalsRef.current.has(area.key)) continue;
            loadedGlobalsRef.current.add(area.key);
            fetch(`/api/editor/pages/${area.pageId}`)
                .then((r) => (r.ok ? r.json() : null))
                .then((loaded) => {
                    // Drop the response if the area's own page was opened while
                    // it was in flight — the clear branch above already unmarked
                    // it, so it reloads when that page closes.
                    if (!loaded || !mountedRef.current || openGlobalRef.current === area.key) return;
                    skipHistoryRef.current[area.key] = true;
                    setArea(area.key, loaded);
                    markSaved(area.key, JSON.stringify(loaded));
                })
                .catch(() => loadedGlobalsRef.current.delete(area.key));
        }
    }, [openGlobalKey]);

    const applyPageMeta = useCallback((patch) => {
        const applyTo = (page) => {
            if (!page) return page;
            const next = {...page, ...patch};
            if (!next.hidden) delete next.hidden;
            return next;
        };
        skipHistoryRef.current[PAGE_AREA] = true;
        setData((prev) => ({...prev, [PAGE_AREA]: applyTo(prev[PAGE_AREA])}));
        setSavedJson((prev) => {
            if (!prev[PAGE_AREA]) return prev;
            try {
                return {...prev, [PAGE_AREA]: JSON.stringify(applyTo(JSON.parse(prev[PAGE_AREA])))};
            } catch {
                return prev;
            }
        });
    }, []);

    const dirty = useMemo(() => {
        const out = {};
        for (const key of AREA_KEYS) {
            out[key] = !!data[key] && JSON.stringify(data[key]) !== savedJson[key];
        }
        return out;
    }, [data, savedJson]);
    const isDirty = AREA_KEYS.some((key) => dirty[key]);

    return {
        areas: data,
        setArea,
        markSaved,
        applyPageMeta,
        dirty,
        isDirty,
        undo: history.undo,
        redo: history.redo,
        canUndo: history.canUndo,
        canRedo: history.canRedo,
    };
}
