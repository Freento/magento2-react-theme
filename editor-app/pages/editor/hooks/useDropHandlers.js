import {useCellActions} from './useCellActions.js';
import {useTreeDrop} from './useTreeDrop.js';
import {useCanvasDrop} from './useCanvasDrop.js';

export function useDropHandlers({
                                    dragType,
                                    dragData,
                                    dropTarget,
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
                                }) {
    const cell = useCellActions({
        sideForBlockId,
        activeTarget,
        getBlocksFor,
        setBlocksFor,
    });

    const tree = useTreeDrop({
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
    });

    const canvas = useCanvasDrop({
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
    });

    return {
        ...cell,
        ...tree,
        ...canvas,
    };
}
