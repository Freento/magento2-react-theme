import {useState, useCallback} from 'react';
import {findBlock} from '../lib/blockTree.js';

export function useDragState({pageData, footerData}) {
    // Drag and drop
    const [dragType, setDragType] = useState(null);
    const [dragData, setDragData] = useState(null);
    const [dropTarget, setDropTarget] = useState(null);
    const [treeDropTarget, setTreeDropTarget] = useState(null);

    const isDraggingValue =
        dragType === 'reorder' ? dragData
            : dragType === 'reorder-cell' ? 'cell'
                : dragType === 'new' ? 'new'
                    : false;

    const draggedComponent = (() => {
        if (dragType === 'new') return dragData; // dragData IS the component name
        if (dragType === 'reorder' && dragData) {
            const inPage = findBlock(pageData?.blocks || [], dragData);
            if (inPage) return inPage.component;
            const inFooter = findBlock(footerData?.blocks || [], dragData);
            if (inFooter) return inFooter.component;
        }
        return null;
    })();

    const handleCatalogDragStart = useCallback((e, componentName) => {
        setDragType('new');
        setDragData(componentName);
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', componentName);
    }, []);

    const handleTreeDragStart = useCallback((e, blockId) => {
        setDragType('reorder');
        setDragData(blockId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', blockId);
    }, []);

    const handlePreviewDragStart = useCallback((blockId) => {
        setDragType('reorder');
        setDragData(blockId);
    }, []);

    const handlePreviewCellDragStart = useCallback((payload) => {
        setDragType('reorder-cell');
        setDragData(payload);
    }, []);

    const handleDragEnd = useCallback(() => {
        setDragType(null);
        setDragData(null);
        setDropTarget(null);
        setTreeDropTarget(null);
    }, []);

    return {
        dragType,
        dragData,
        dropTarget,
        treeDropTarget,
        setDragType,
        setDragData,
        setDropTarget,
        setTreeDropTarget,
        isDraggingValue,
        draggedComponent,
        handleCatalogDragStart,
        handleTreeDragStart,
        handlePreviewDragStart,
        handlePreviewCellDragStart,
        handleDragEnd,
    };
}
