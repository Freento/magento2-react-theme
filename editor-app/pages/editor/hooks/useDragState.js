import {useState, useCallback, useEffect} from 'react';

export function useDragState({findBlockById}) {
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
        // The dragged block can sit in any region, not just the page.
        if (dragType === 'reorder' && dragData) return findBlockById(dragData)?.component || null;
        return null;
    })();

    const handleCatalogDragStart = useCallback((e, componentName) => {
        setDragType('new');
        setDragData(componentName);
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', componentName);
    }, []);

    const handleTreeDragStart = useCallback((e, blockId) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', blockId);
        requestAnimationFrame(() => {
            setDragType('reorder');
            setDragData(blockId);
        });
    }, []);

    const handlePreviewDragStart = useCallback((blockId) => {
        setDragType('reorder');
        setDragData(blockId);
    }, []);

    const handlePreviewCellDragStart = useCallback((payload) => {
        setDragType('reorder-cell');
        setDragData(payload);
    }, []);

    const [fileDrag, setFileDrag] = useState(false);
    const startFileDrag = useCallback((component = 'Image') => {
        setFileDrag(true);
        setDragType('new');
        setDragData(component);
    }, []);

    const handleDragEnd = useCallback(() => {
        setFileDrag(false);
        setDragType(null);
        setDragData(null);
        setDropTarget(null);
        setTreeDropTarget(null);
    }, []);

    useEffect(() => {
        if (!fileDrag) return undefined;
        const leave = (e) => {
            if (e.relatedTarget) return;
            const out = e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight;
            if (out) handleDragEnd();
        };
        window.addEventListener('drop', handleDragEnd);
        window.addEventListener('dragleave', leave);
        return () => {
            window.removeEventListener('drop', handleDragEnd);
            window.removeEventListener('dragleave', leave);
        };
    }, [fileDrag, handleDragEnd]);

    return {
        startFileDrag,
        externalDrag: fileDrag,
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
