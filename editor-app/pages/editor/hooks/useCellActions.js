import {useCallback} from 'react';
import {generateId} from '../lib/color.js';

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
            const dupes = (b.children || [])
                .filter((kid) => {
                    const ks = kid.style || {};
                    return Number(ks.rowStart) === cell.r && Number(ks.colStart) === cell.c;
                })
                .map(reId);
            return {...b, children: [...(b.children || []), ...dupes]};
        });
        setBlocksFor(side, walk(blocks));
    }, [sideForBlockId, activeTarget, getBlocksFor, setBlocksFor]);

    return {
        handleCellDelete,
        handleCellDuplicate,
    };
}
