import {useCallback} from 'react';
import registry from 'editor-core/registry';
import {
    findBlock,
    findBlockLocation,
    removeBlockFromTree,
    insertBlockInTree,
    applyCellPin,
} from '../lib/blockTree.js';
import {simulateGridPlacement} from 'editor-core/renderer';
import {generateId} from '../lib/color.js';

export function useTreeDrop({
                                dragType,
                                dragData,
                                treeDropTarget,
                                setTreeDropTarget,
                                handleDragEnd,
                                isDropAllowed,
                                sideForBlockId,
                                activeTarget,
                                getBlocksFor,
                                setBlocksFor,
                                setSelectedBlockId,
                                setActiveTab,
                            }) {
    const handleTreeDragOver = useCallback(
        (e, block, blocks, side) => {
            if (!dragType) return;
            if (dragType === 'reorder' && dragData === block.id) return;
            e.preventDefault();
            e.stopPropagation();

            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const h = rect.height;
            const acceptsChildren = registry[block.component]?.acceptsChildren;
            const loc = findBlockLocation(blocks, block.id, 'root-page');
            if (!loc) return;

            if (acceptsChildren && y > h * 0.25 && y < h * 0.75) {
                setTreeDropTarget({
                    blockId: block.id,
                    position: 'inside',
                    parentId: block.id,
                    index: (block.children || []).length,
                    side,
                });
            } else if (y < h / 2) {
                setTreeDropTarget({blockId: block.id, position: 'before', parentId: loc.parentId, index: loc.index, side});
            } else {
                setTreeDropTarget({blockId: block.id, position: 'after', parentId: loc.parentId, index: loc.index + 1, side});
            }
        },
        [dragType, dragData, findBlockLocation]
    );

    const handleTreeDrop = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!treeDropTarget) {
                handleDragEnd();
                return;
            }
            const rootId = 'root-page';
            const targetSide =
                treeDropTarget.side ||
                sideForBlockId(treeDropTarget.parentId) ||
                activeTarget;
            const indexInTree = (tree) => {
                if (treeDropTarget.position === 'inside') return treeDropTarget.index;
                const loc = findBlockLocation(tree, treeDropTarget.blockId, rootId);
                if (!loc) return treeDropTarget.index;
                return loc.index + (treeDropTarget.position === 'after' ? 1 : 0);
            };
            const pinForTarget = (tree, block) => {
                const parent = treeDropTarget.parentId && treeDropTarget.parentId !== rootId
                    ? findBlock(tree, treeDropTarget.parentId)
                    : null;
                if (!parent || parent.component !== 'Grid') return block;
                if (treeDropTarget.position === 'inside') return applyCellPin(block, null);
                const idx = (parent.children || []).findIndex((k) => k.id === treeDropTarget.blockId);
                const cell = idx >= 0 ? simulateGridPlacement(parent).childCells[idx] : null;
                return cell ? applyCellPin(block, {r: cell.r, c: cell.c}) : applyCellPin(block, null);
            };
            if (dragType === 'new' && dragData) {
                if (!isDropAllowed(dragData, treeDropTarget.parentId)) {
                    handleDragEnd();
                    return;
                }
                const reg = registry[dragData];
                const newBlock = {
                    id: generateId(),
                    component: dragData,
                    props: {...reg.defaultProps},
                    style: {},
                    ...(reg.acceptsChildren ? {children: []} : {}),
                };
                const targetTree = getBlocksFor(targetSide);
                setBlocksFor(targetSide, insertBlockInTree(targetTree, treeDropTarget.parentId, treeDropTarget.index, pinForTarget(targetTree, newBlock), rootId));
                setSelectedBlockId(newBlock.id);
                setActiveTab('settings');
            } else if (dragType === 'reorder' && dragData) {
                const sourceSide = sideForBlockId(dragData) || targetSide;
                const sourceBlocks = getBlocksFor(sourceSide);
                const movedPeek = findBlock(sourceBlocks, dragData);
                if (!movedPeek || !isDropAllowed(movedPeek.component, treeDropTarget.parentId)) {
                    handleDragEnd();
                    return;
                }
                const [sourceTree, moved] = removeBlockFromTree(sourceBlocks, dragData);
                if (moved) {
                    if (sourceSide === targetSide) {
                        setBlocksFor(targetSide, insertBlockInTree(sourceTree, treeDropTarget.parentId, indexInTree(sourceTree), pinForTarget(sourceTree, moved), rootId));
                    } else {
                        const targetTree = getBlocksFor(targetSide);
                        setBlocksFor(sourceSide, sourceTree);
                        setBlocksFor(targetSide, insertBlockInTree(targetTree, treeDropTarget.parentId, indexInTree(targetTree), pinForTarget(targetTree, moved), rootId));
                    }
                }
            }
            handleDragEnd();
        },
        [dragType, dragData, treeDropTarget, activeTarget, sideForBlockId, getBlocksFor, setBlocksFor, insertBlockInTree, removeBlockFromTree, handleDragEnd, findBlock, isDropAllowed]
    );

    return {
        handleTreeDragOver,
        handleTreeDrop,
    };
}
