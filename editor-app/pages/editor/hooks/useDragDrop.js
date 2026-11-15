import {useDragState} from './useDragState.js';
import {useDropHandlers} from './useDropHandlers.js';

export function useDragDrop({
                                findBlockById,
                                isDropAllowed,
                                sideForBlockId,
                                activeTarget,
                                getBlocksFor,
                                setBlocksFor,
                                setSelectedBlockId,
                                setActiveTab,
                                showToast,
                            }) {
    const state = useDragState({findBlockById});

    const drop = useDropHandlers({
        dragType: state.dragType,
        dragData: state.dragData,
        dropTarget: state.dropTarget,
        externalDrag: state.externalDrag,
        treeDropTarget: state.treeDropTarget,
        setTreeDropTarget: state.setTreeDropTarget,
        handleDragEnd: state.handleDragEnd,
        draggedComponent: state.draggedComponent,
        isDropAllowed,
        sideForBlockId,
        activeTarget,
        getBlocksFor,
        setBlocksFor,
        setSelectedBlockId,
        setActiveTab,
        showToast,
    });

    return {...state, ...drop};
}
