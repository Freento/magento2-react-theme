import {useCallback} from 'react';
import {generateId} from '../lib/color.js';
import {findBlock, holdsSystemBlock, SYSTEM_BLOCK_NOTICE} from '../lib/blockTree.js';

export function useCellActions({
                                   sideForBlockId,
                                   activeTarget,
                                   getBlocksFor,
                                   setBlocksFor,
                                   showToast,
                               }) {
    // A grid cell that holds a system block is as protected as the block itself.
    const isCellProtected = useCallback((blocks, parentId, cell) => {
        const kids = findBlock(blocks, parentId)?.children || [];
        const hit = kids.some((kid) => {
            const ks = kid.style || {};
            return Number(ks.rowStart) === cell.r && Number(ks.colStart) === cell.c && holdsSystemBlock(kid);
        });
        if (hit) showToast?.(SYSTEM_BLOCK_NOTICE, 'info');
        return hit;
    }, [showToast]);

    const handleCellDelete = useCallback(({parentId, cell}) => {
        const side = sideForBlockId(parentId) || activeTarget;
        const blocks = getBlocksFor(side);
        if (isCellProtected(blocks, parentId, cell)) return;
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
    }, [sideForBlockId, activeTarget, getBlocksFor, setBlocksFor, isCellProtected]);

    const handleCellDuplicate = useCallback(({parentId, cell}) => {
        const side = sideForBlockId(parentId) || activeTarget;
        const blocks = getBlocksFor(side);
        if (isCellProtected(blocks, parentId, cell)) return;
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
    }, [sideForBlockId, activeTarget, getBlocksFor, setBlocksFor, isCellProtected]);

    return {
        handleCellDelete,
        handleCellDuplicate,
    };
}
