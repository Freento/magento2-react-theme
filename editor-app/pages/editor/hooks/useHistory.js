import {useState, useRef, useEffect, useCallback} from 'react';
import {AREA_KEYS, areaMap} from '../lib/areas.js';

const HISTORY_LIMIT = 50;

// Undo/redo across every editable region. `data` is the area map owned by
// useAreas, `setArea(key, next)` its writer — one snapshot pass replaces the
// identical per-region effects this used to carry.
export function useHistory({data, setArea}) {
    const [historyPast, setHistoryPast] = useState([]);
    const [historyFuture, setHistoryFuture] = useState([]);
    // Set by whoever writes an area without wanting it on the undo stack
    // (initial load, and undo/redo itself).
    const skipHistoryRef = useRef(areaMap(false));
    const lastSnapshotRef = useRef(areaMap(null));

    useEffect(() => {
        for (const key of AREA_KEYS) {
            const value = data[key];
            if (!value) continue;
            const current = JSON.stringify(value);
            if (skipHistoryRef.current[key]) {
                skipHistoryRef.current[key] = false;
                lastSnapshotRef.current[key] = current;
                continue;
            }
            const prev = lastSnapshotRef.current[key];
            if (prev === null) {
                lastSnapshotRef.current[key] = current;
                continue;
            }
            // Areas that did not change this render fall out here.
            if (prev === current) continue;
            setHistoryPast((past) => [...past, {target: key, snapshot: prev}].slice(-HISTORY_LIMIT));
            setHistoryFuture([]);
            lastSnapshotRef.current[key] = current;
        }
    }, [data]);

    const restore = useCallback((entry) => {
        skipHistoryRef.current[entry.target] = true;
        setArea(entry.target, JSON.parse(entry.snapshot));
    }, [setArea]);

    const undo = useCallback(() => {
        setHistoryPast((past) => {
            if (past.length === 0) return past;
            const entry = past[past.length - 1];
            const current = lastSnapshotRef.current[entry.target];
            restore(entry);
            if (current !== null) {
                setHistoryFuture((f) => [{target: entry.target, snapshot: current}, ...f].slice(0, HISTORY_LIMIT));
            }
            return past.slice(0, -1);
        });
    }, [restore]);

    const redo = useCallback(() => {
        setHistoryFuture((future) => {
            if (future.length === 0) return future;
            const entry = future[0];
            const current = lastSnapshotRef.current[entry.target];
            restore(entry);
            if (current !== null) {
                setHistoryPast((p) => [...p, {target: entry.target, snapshot: current}].slice(-HISTORY_LIMIT));
            }
            return future.slice(1);
        });
    }, [restore]);

    const canUndo = historyPast.length > 0;
    const canRedo = historyFuture.length > 0;
    const resetHistory = useCallback(() => {
        setHistoryPast([]);
        setHistoryFuture([]);
    }, []);

    return {undo, redo, canUndo, canRedo, skipHistoryRef, lastSnapshotRef, resetHistory};
}
