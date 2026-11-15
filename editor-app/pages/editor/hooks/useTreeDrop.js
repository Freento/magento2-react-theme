import {useCallback} from 'react';
import registry from 'editor-core/registry';
import {findBlock, findBlockLocation} from '../lib/blockTree.js';

const findBlockComponent = (blocks, id) => findBlock(blocks, id)?.component || null;

const sameTarget = (a, b) =>
    !!a && !!b &&
    a.blockId === b.blockId &&
    a.position === b.position &&
    a.parentId === b.parentId &&
    a.index === b.index &&
    a.cell?.r === b.cell?.r &&
    a.cell?.c === b.cell?.c;

export function useTreeDrop({
                                dragType,
                                dragData,
                                treeDropTarget,
                                setTreeDropTarget,
                                handleDragEnd,
                                applyDrop,
                            }) {
    const handleTreeDragOver = useCallback(
        (e, block, blocks, target, groupCell) => {
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

            const movesColumn = dragType === 'reorder' && !!dragData && blocks && findBlockComponent(blocks, dragData) === 'Column';
            const cell = groupCell && block.component !== 'Column' && !movesColumn
                ? {r: Number(groupCell.r), c: Number(groupCell.c)}
                : undefined;
            let next;
            if (acceptsChildren && y > h * 0.25 && y < h * 0.75) {
                next = {blockId: block.id, position: 'inside', parentId: block.id, index: (block.children || []).length, target};
            } else if (y < h / 2) {
                next = {blockId: block.id, position: 'before', parentId: loc.parentId, index: loc.index, cell, target};
            } else {
                next = {blockId: block.id, position: 'after', parentId: loc.parentId, index: loc.index + 1, cell, target};
            }
            setTreeDropTarget((cur) => (sameTarget(cur, next) ? cur : next));
        },
        [dragType, dragData, setTreeDropTarget]
    );

    const handleTreeDrop = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!treeDropTarget) {
                handleDragEnd();
                return;
            }
            const {parentId, index, cell, target} = treeDropTarget;
            applyDrop({dragType, dragData, dropTarget: {parentId, index, cell, target}});
        },
        [dragType, dragData, treeDropTarget, applyDrop, handleDragEnd]
    );

    return {
        handleTreeDragOver,
        handleTreeDrop,
    };
}
