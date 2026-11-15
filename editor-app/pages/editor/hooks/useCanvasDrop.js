import {useCallback} from 'react';
import registry from 'editor-core/registry';
import {
    findBlock,
    findBlockLocation,
    removeBlockFromTree,
    insertBlockInTree,
    applyCellPin,
    pinSameCellSiblings,
    dropRedundantCellPins,
    pruneEmptyColumns,
    holdsSystemBlock,
} from '../lib/blockTree.js';
import {generateId} from '../lib/color.js';
import {addPendingUpload, validateImageFile} from '../lib/pendingUploads.js';
import {plainToRich} from 'editor-core/lib/richText';

export function useCanvasDrop({
                                  dragType,
                                  dragData,
                                  dropTarget,
                                  externalDrag,
                                  handleDragEnd,
                                  draggedComponent,
                                  isDropAllowed,
                                  sideForBlockId,
                                  activeTarget,
                                  getBlocksFor,
                                  setBlocksFor,
                                  setSelectedBlockId,
                                  setActiveTab,
                                  showToast,
                              }) {
    const validateDrop = useCallback(
        (target, targetArea) => {
            if (!draggedComponent) return true;
            const parentId = target && typeof target === 'object' ? target.parentId : target;
            return isDropAllowed(draggedComponent, parentId, dragType === 'reorder' ? dragData : null, targetArea);
        },
        [draggedComponent, isDropAllowed, dragType, dragData]
    );

    const applyDrop = useCallback(({dragType, dragData, dropTarget, external = false, file = null, text = ''}) => {
        if (!dropTarget) {
            handleDragEnd();
            return;
        }
        if (!external) {
            file = null;
            text = '';
        } else if (dragData === 'Image') {
            const invalid = file ? validateImageFile(file) : 'Drop an image file.';
            if (invalid) {
                showToast?.(invalid, 'error', 6000);
                handleDragEnd();
                return;
            }
        } else if (dragData === 'Text') {
            text = String(text || '').trim();
            if (!text) {
                handleDragEnd();
                return;
            }
        }
        const rootId = 'root-page';
        const GRID_PINS = ['colStart', 'rowStart'];
        const intoGridCell = (blocks, block) => {
            const parent = findBlock(blocks, dropTarget.parentId);
            if (parent?.component !== 'Grid' || block.component === 'Column') return block;
            const style = {...(block.style || {})};
            for (const k of GRID_PINS) delete style[k];
            return {
                id: generateId(),
                component: 'Column',
                props: {gap: 8, flex: 1},
                style: {},
                children: [{...block, style}],
            };
        };
        const targetSide = sideForBlockId(dropTarget.parentId) || dropTarget.target || activeTarget;
        const side = (dragType === 'reorder' && sideForBlockId(dragData)) || targetSide;
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
                props: {
                    ...reg.defaultProps,
                    ...(file && dragData === 'Image' ? {src: addPendingUpload(file)} : {}),
                    ...(text && dragData === 'Text' ? {html: plainToRich(text)} : {}),
                },
                style: {},
                ...(reg.acceptsChildren ? {children: []} : {}),
            };
            newBlock = applyCellPin(intoGridCell(blocks, newBlock), dropTarget.cell);
            let base = pinSameCellSiblings(blocks, dropTarget.parentId, dropTarget.cell);
            if (!dropTarget.cell) base = dropRedundantCellPins(base, dropTarget.parentId);
            setBlocksFor(side, insertBlockInTree(base, dropTarget.parentId, dropTarget.index, newBlock, rootId));
            setSelectedBlockId(newBlock.id);
            setActiveTab('settings');
        } else if (dragType === 'reorder' && dragData) {
            const movedPeek = findBlock(blocks, dragData);
            if (!movedPeek) {
                handleDragEnd();
                return;
            }
            if (!isDropAllowed(movedPeek.component, dropTarget.parentId, dragData)) {
                handleDragEnd();
                return;
            }
            // Final gate for the region rule: here both ends of the move are known.
            if (targetSide !== side && holdsSystemBlock(movedPeek)) {
                handleDragEnd();
                return;
            }
            const pinnedBlocks = targetSide === side && dropTarget.cell
                ? pinSameCellSiblings(blocks, dropTarget.parentId, dropTarget.cell)
                : blocks;
            let [tree, moved] = removeBlockFromTree(pinnedBlocks, dragData);
            if (moved && targetSide !== side) {
                setBlocksFor(side, pruneEmptyColumns(tree));
                let dst = getBlocksFor(targetSide);
                moved = applyCellPin(intoGridCell(dst, moved), dropTarget.cell);
                dst = pinSameCellSiblings(dst, dropTarget.parentId, dropTarget.cell);
                if (!dropTarget.cell) dst = dropRedundantCellPins(dst, dropTarget.parentId);
                setBlocksFor(targetSide, insertBlockInTree(dst, dropTarget.parentId, dropTarget.index, moved, rootId));
            } else if (moved) {
                const srcLoc = findBlockLocation(blocks, dragData, rootId);
                let insertIndex = dropTarget.index;
                if (srcLoc && srcLoc.parentId === dropTarget.parentId && srcLoc.index < dropTarget.index) {
                    insertIndex = dropTarget.index - 1;
                }
                const sameParent = !!srcLoc && srcLoc.parentId === dropTarget.parentId;
                moved = applyCellPin(sameParent ? moved : intoGridCell(tree, moved), dropTarget.cell);
                if (!dropTarget.cell) tree = dropRedundantCellPins(tree, dropTarget.parentId);
                tree = insertBlockInTree(tree, dropTarget.parentId, insertIndex, moved, rootId);
                setBlocksFor(side, pruneEmptyColumns(tree));
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
    }, [activeTarget, sideForBlockId, getBlocksFor, setBlocksFor, handleDragEnd, isDropAllowed, showToast]);

    const handleDrop = useCallback(
        ({file = null, text = ''} = {}) => applyDrop({dragType, dragData, dropTarget, external: externalDrag, file, text}),
        [applyDrop, dragType, dragData, dropTarget, externalDrag]
    );

    return {
        validateDrop,
        applyDrop,
        handleDrop,
    };
}
