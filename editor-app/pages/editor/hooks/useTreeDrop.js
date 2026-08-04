import {useCallback} from 'react';
import registry from 'editor-core/registry';
import {
    findBlock,
    findBlockLocation,
    removeBlockFromTree,
    insertBlockInTree,
} from '../lib/blockTree.js';
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
        (e, block, blocks) => {
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
                    index: (block.children || []).length
                });
            } else if (y < h / 2) {
                setTreeDropTarget({blockId: block.id, position: 'before', parentId: loc.parentId, index: loc.index});
            } else {
                setTreeDropTarget({blockId: block.id, position: 'after', parentId: loc.parentId, index: loc.index + 1});
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
            const side =
                (dragType === 'reorder' && sideForBlockId(dragData)) ||
                sideForBlockId(treeDropTarget.parentId) ||
                activeTarget;
            const blocks = getBlocksFor(side);
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
                setBlocksFor(side, insertBlockInTree(blocks, treeDropTarget.parentId, treeDropTarget.index, newBlock, rootId));
                setSelectedBlockId(newBlock.id);
                setActiveTab('settings');
            } else if (dragType === 'reorder' && dragData) {
                const movedPeek = findBlock(blocks, dragData);
                if (!movedPeek || !isDropAllowed(movedPeek.component, treeDropTarget.parentId)) {
                    handleDragEnd();
                    return;
                }
                const [tree, moved] = removeBlockFromTree(blocks, dragData);
                if (moved) {
                    setBlocksFor(side, insertBlockInTree(tree, treeDropTarget.parentId, treeDropTarget.index, moved, rootId));
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
