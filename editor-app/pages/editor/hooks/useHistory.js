import {useState, useRef, useEffect, useCallback} from 'react';

export function useHistory({pageData, setPageData, footerData, setFooterData}) {
    const [historyPast, setHistoryPast] = useState([]);
    const [historyFuture, setHistoryFuture] = useState([]);
    const skipHistoryRef = useRef({page: false, footer: false});
    const lastSnapshotRef = useRef({page: null, footer: null});

    useEffect(() => {
        if (!pageData) return;
        if (skipHistoryRef.current.page) {
            skipHistoryRef.current.page = false;
            lastSnapshotRef.current.page = JSON.stringify(pageData);
            return;
        }
        const current = JSON.stringify(pageData);
        const prev = lastSnapshotRef.current.page;
        if (prev === null) {
            lastSnapshotRef.current.page = current;
            return;
        }
        if (prev === current) return;
        setHistoryPast((past) => [...past, {target: 'page', snapshot: prev}].slice(-50));
        setHistoryFuture([]);
        lastSnapshotRef.current.page = current;
    }, [pageData]);

    useEffect(() => {
        if (!footerData) return;
        if (skipHistoryRef.current.footer) {
            skipHistoryRef.current.footer = false;
            lastSnapshotRef.current.footer = JSON.stringify(footerData);
            return;
        }
        const current = JSON.stringify(footerData);
        const prev = lastSnapshotRef.current.footer;
        if (prev === null) {
            lastSnapshotRef.current.footer = current;
            return;
        }
        if (prev === current) return;
        setHistoryPast((past) => [...past, {target: 'footer', snapshot: prev}].slice(-50));
        setHistoryFuture([]);
        lastSnapshotRef.current.footer = current;
    }, [footerData]);

    const undo = useCallback(() => {
        setHistoryPast((past) => {
            if (past.length === 0) return past;
            const entry = past[past.length - 1];
            const current = lastSnapshotRef.current[entry.target];
            skipHistoryRef.current[entry.target] = true;
            if (entry.target === 'footer') setFooterData(JSON.parse(entry.snapshot));
            else setPageData(JSON.parse(entry.snapshot));
            if (current !== null) {
                setHistoryFuture((f) => [{target: entry.target, snapshot: current}, ...f].slice(0, 50));
            }
            return past.slice(0, -1);
        });
    }, []);

    const redo = useCallback(() => {
        setHistoryFuture((future) => {
            if (future.length === 0) return future;
            const entry = future[0];
            const current = lastSnapshotRef.current[entry.target];
            skipHistoryRef.current[entry.target] = true;
            if (entry.target === 'footer') setFooterData(JSON.parse(entry.snapshot));
            else setPageData(JSON.parse(entry.snapshot));
            if (current !== null) {
                setHistoryPast((p) => [...p, {target: entry.target, snapshot: current}].slice(-50));
            }
            return future.slice(1);
        });
    }, []);

    const canUndo = historyPast.length > 0;
    const canRedo = historyFuture.length > 0;
    const resetHistory = () => {
        setHistoryPast([]);
        setHistoryFuture([]);
    };

    return {undo, redo, canUndo, canRedo, skipHistoryRef, lastSnapshotRef, resetHistory};
}
