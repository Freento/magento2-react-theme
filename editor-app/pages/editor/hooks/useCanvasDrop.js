import {useCallback} from 'react';
import registry from 'editor-core/registry';
import {
    findBlock,
    removeBlockFromTree,
    insertBlockInTree,
    applyCellPin,
    pinSameCellSiblings,
} from '../lib/blockTree.js';
import {generateId} from '../lib/color.js';

export function useCanvasDrop({
                                  dragType,
                                  dragData,
                                  dropTarget,
                                  handleDragEnd,
                                  draggedComponent,
                                  isDropAllowed,
                                  sideForBlockId,
                                  activeTarget,
                                  getBlocksFor,
                                  setBlocksFor,
                                  setSelectedBlockId,
                                  setActiveTab,
                              }) {
    const validateDrop = useCallback(
        (target) => {
            if (!draggedComponent) return true;
            const parentId = target && typeof target === 'object' ? target.parentId : target;
            return isDropAllowed(draggedComponent, parentId);
        },
        [draggedComponent, isDropAllowed]
    );

    const handleDrop = useCallback(() => {
        if (!dropTarget) {
            handleDragEnd();
            return;
        }
        const rootId = 'root-page';
        const side =
            (dragType === 'reorder' && sideForBlockId(dragData)) ||
            sideForBlockId(dropTarget.parentId) ||
            activeTarget;
        const blocks = getBlocksFor(side);
        if (dragType === 'new' && dragData) {
            const reg = registry[dragData];
            if (!isDropAllowed(dragData, dropTarget.parentId)) {
                handleDragEnd();
                return;
            }
            let newBlock = {
                id: generateId(),
                component: dragData,
                props: {...reg.defaultProps},
                style: {},
                ...(reg.acceptsChildren ? {children: []} : {}),
            };
            newBlock = applyCellPin(newBlock, dropTarget.cell);
            const pinned = pinSameCellSiblings(blocks, dropTarget.parentId, dropTarget.cell);
            setBlocksFor(side, insertBlockInTree(pinned, dropTarget.parentId, dropTarget.index, newBlock, rootId));
            setSelectedBlockId(newBlock.id);
            setActiveTab('settings');
        } else if (dragType === 'reorder' && dragData) {
            const movedPeek = findBlock(blocks, dragData);
            if (!movedPeek) {
                handleDragEnd();
                return;
            }
            if (!isDropAllowed(movedPeek.component, dropTarget.parentId)) {
                handleDragEnd();
                return;
            }
            let [tree, moved] = removeBlockFromTree(blocks, dragData);
            if (moved) {
                moved = applyCellPin(moved, dropTarget.cell);
                tree = pinSameCellSiblings(tree, dropTarget.parentId, dropTarget.cell);
                tree = insertBlockInTree(tree, dropTarget.parentId, dropTarget.index, moved, rootId);
                setBlocksFor(side, tree);
            }
        } else if (dragType === 'reorder-cell' && dragData && dropTarget.cell) {
            const {parentId: srcParentId, cell: srcCell} = dragData;
            const tgt = dropTarget.cell;
            const dropSide = dropTarget.side || 'right';
            if (srcParentId !== dropTarget.parentId) {
                handleDragEnd();
                return;
            }
            if (srcCell.r !== tgt.r) {
                handleDragEnd();
                return;
            }
            if (srcCell.c === tgt.c) {
                handleDragEnd();
                return;
            }
            const mapTree = (arr) => arr.map((b) => {
                if (b.id !== srcParentId) {
                    return b.children ? {...b, children: mapTree(b.children)} : b;
                }
                const kids = b.children || [];
                const inRow = [];
                const others = [];
                for (const k of kids) {
                    if (Number(k.style?.rowStart) === srcCell.r) inRow.push(k);
                    else others.push(k);
                }
                const byCol = new Map();
                for (const k of inRow) {
                    const c = Number(k.style?.colStart);
                    if (!byCol.has(c)) byCol.set(c, []);
                    byCol.get(c).push(k);
                }
                const cols = [...byCol.keys()].sort((a, b) => a - b);
                const seq = cols.map((c) => byCol.get(c));
                const srcIdx = cols.indexOf(srcCell.c);
                let dstIdx = cols.indexOf(tgt.c);
                if (srcIdx < 0 || dstIdx < 0) return b;
                let insertAt = dropSide === 'right' ? dstIdx + 1 : dstIdx;
                if (srcIdx < insertAt) insertAt -= 1;
                const [moved] = seq.splice(srcIdx, 1);
                seq.splice(insertAt, 0, moved);
                const rebuilt = [];
                seq.forEach((group, i) => {
                    for (const k of group) {
                        rebuilt.push({
                            ...k,
                            style: {...(k.style || {}), colStart: i + 1, rowStart: srcCell.r},
                        });
                    }
                });
                return {...b, children: [...others, ...rebuilt]};
            });
            setBlocksFor(side, mapTree(blocks));
        }
        handleDragEnd();
    }, [dragType, dragData, dropTarget, activeTarget, sideForBlockId, getBlocksFor, setBlocksFor, insertBlockInTree, removeBlockFromTree, handleDragEnd, isDropAllowed, findBlock]);

    return {
        validateDrop,
        handleDrop,
    };
}
