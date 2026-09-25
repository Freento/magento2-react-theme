import {useCallback} from 'react';
import {generateId} from '../lib/color.js';
import {simulateGridPlacement} from 'editor-core/renderer';

export function useCellActions({
                                   sideForBlockId,
                                   activeTarget,
                                   getBlocksFor,
                                   setBlocksFor,
                               }) {
    const handleCellDelete = useCallback(({parentId, cell}) => {
        const side = sideForBlockId(parentId) || activeTarget;
        const blocks = getBlocksFor(side);
        const walk = (arr) => arr.map((b) => {
            if (b.id !== parentId) {
                return b.children ? {...b, children: walk(b.children)} : b;
            }
            const kept = (b.children || []).filter((kid) => {
                const ks = kid.style || {};
                return !(Number(ks.rowStart) === cell.r && Number(ks.colStart) === cell.c);
            });
            return {...b, children: kept};
        });
        setBlocksFor(side, walk(blocks));
    }, [sideForBlockId, activeTarget, getBlocksFor, setBlocksFor]);

    const handleCellDuplicate = useCallback(({parentId, cell}) => {
        const side = sideForBlockId(parentId) || activeTarget;
        const blocks = getBlocksFor(side);
        const reId = (b) => ({
            ...b,
            id: generateId(),
            ...(b.children ? {children: b.children.map(reId)} : {}),
        });
        const walk = (arr) => arr.map((b) => {
            if (b.id !== parentId) {
                return b.children ? {...b, children: walk(b.children)} : b;
            }
            const cols = Math.max(1, Number(b.props?.columns) || 1);
            const rows = Math.max(0, Number(b.props?.rows) || 0);
            const asColumn = cols > 1;
            const sim = simulateGridPlacement(b);
            const pinned = (b.children || []).map((kid, i) => {
                const cc = sim.childCells[i];
                return cc ? {...kid, style: {...(kid.style || {}), colStart: cc.c, rowStart: cc.r}} : kid;
            });
            const inCell = (kid) => Number(kid.style?.rowStart) === cell.r && Number(kid.style?.colStart) === cell.c;
            const shifted = pinned.map((kid) => {
                const st = kid.style || {};
                if (asColumn && Number(st.colStart) > cell.c) return {...kid, style: {...st, colStart: Number(st.colStart) + 1}};
                if (!asColumn && Number(st.rowStart) > cell.r) return {...kid, style: {...st, rowStart: Number(st.rowStart) + 1}};
                return kid;
            });
            const dupes = pinned.filter(inCell).map(reId).map((kid) => ({
                ...kid,
                style: {...kid.style, ...(asColumn ? {colStart: cell.c + 1} : {rowStart: cell.r + 1})},
            }));
            if (!dupes.length) return b;
            const lastIndex = pinned.reduce((acc, kid, i) => (inCell(kid) ? i : acc), -1);
            const children = [...shifted.slice(0, lastIndex + 1), ...dupes, ...shifted.slice(lastIndex + 1)];
            const props = {...(b.props || {})};
            if (asColumn) props.columns = cols + 1;
            else if (rows > 0) props.rows = rows + 1;
            return {...b, props, children};
        });
        setBlocksFor(side, walk(blocks));
    }, [sideForBlockId, activeTarget, getBlocksFor, setBlocksFor]);

    return {
        handleCellDelete,
        handleCellDuplicate,
    };
}
