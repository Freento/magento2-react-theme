import {useCellActions} from './useCellActions.js';
import {useTreeDrop} from './useTreeDrop.js';
import {useCanvasDrop} from './useCanvasDrop.js';

export function useDropHandlers({
                                    dragType,
                                    dragData,
                                    dropTarget,
                                    externalDrag,
                                    treeDropTarget,
                                    setTreeDropTarget,
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
    const cell = useCellActions({
        sideForBlockId,
        activeTarget,
        getBlocksFor,
        setBlocksFor,
        showToast,
    });

    const canvas = useCanvasDrop({
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
    });

    const tree = useTreeDrop({
        dragType,
        dragData,
        treeDropTarget,
        setTreeDropTarget,
        handleDragEnd,
        applyDrop: canvas.applyDrop,
    });

    return {
        ...cell,
        ...tree,
        ...canvas,
    };
}
