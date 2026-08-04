import {useDragState} from './useDragState.js';
import {useDropHandlers} from './useDropHandlers.js';

export function useDragDrop({
                                pageData,
                                footerData,
                                isDropAllowed,
                                sideForBlockId,
                                activeTarget,
                                getBlocksFor,
                                setBlocksFor,
                                setSelectedBlockId,
                                setActiveTab,
                            }) {
    const state = useDragState({pageData, footerData});

    const drop = useDropHandlers({
        dragType: state.dragType,
        dragData: state.dragData,
        dropTarget: state.dropTarget,
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
    });

    return {...state, ...drop};
}
