import {simulateGridPlacement} from 'editor-core/renderer';
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
            if (srcParentId !== dropTarget.parentId || (srcCell.r === tgt.r && srcCell.c === tgt.c)) {
                handleDragEnd();
                return;
            }
            const mapTree = (arr) => arr.map((b) => {
                if (b.id !== srcParentId) {
                    return b.children ? {...b, children: mapTree(b.children)} : b;
                }
                const sim = simulateGridPlacement(b);
                const kids = (b.children || []).map((k, i) => {
                    const cc = sim.childCells[i];
                    return cc ? {...k, style: {...(k.style || {}), colStart: cc.c, rowStart: cc.r}} : k;
                });
                const rowOf = (k) => Number(k.style?.rowStart);
                const colOf = (k) => Number(k.style?.colStart);
                const isMoving = (k) => rowOf(k) === srcCell.r && colOf(k) === srcCell.c;
                const moving = kids.filter(isMoving);
                if (!moving.length) return b;
                const rest = kids.filter((k) => !isMoving(k));
                const rowSeq = (r) => {
                    const byCol = new Map();
                    for (const k of rest) {
                        if (rowOf(k) !== r) continue;
                        if (!byCol.has(colOf(k))) byCol.set(colOf(k), []);
                        byCol.get(colOf(k)).push(k);
                    }
                    return [...byCol.keys()].sort((a, c) => a - c).map((c) => byCol.get(c));
                };
                const pins = new Map();
                const renumber = (seq, r) => seq.forEach((group, i) => group.forEach((k) => pins.set(k.id, {colStart: i + 1, rowStart: r})));
                const targetOccupied = rest.some((k) => rowOf(k) === tgt.r && colOf(k) === tgt.c);
                if (targetOccupied) {
                    const seq = rowSeq(tgt.r);
                    const dstIdx = seq.findIndex((group) => colOf(group[0]) === tgt.c);
                    seq.splice(dropSide === 'right' ? dstIdx + 1 : dstIdx, 0, moving);
                    renumber(seq, tgt.r);
                } else {
                    moving.forEach((k) => pins.set(k.id, {colStart: tgt.c, rowStart: tgt.r}));
                }
                if (srcCell.r !== tgt.r) renumber(rowSeq(srcCell.r), srcCell.r);
                const children = kids.map((k) => (pins.has(k.id) ? {...k, style: {...k.style, ...pins.get(k.id)}} : k));
                const maxCol = children.reduce((m, k) => Math.max(m, colOf(k) || 0), 0);
                const columns = Math.max(1, Number(b.props?.columns) || 1);
                const props = maxCol > columns ? {...(b.props || {}), columns: maxCol} : b.props;
                return {...b, props, children};
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
