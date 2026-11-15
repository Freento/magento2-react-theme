export function ContainerTailZone({ parentId, childrenCount, onDropTargetChange, dropTarget, horizontal, target }) {
  const isActive = dropTarget?.parentId === parentId && dropTarget?.index === childrenCount;
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isActive) return;
        onDropTargetChange({ parentId, index: childrenCount, target });
      }}
      style={{
        pointerEvents: 'auto',
        minHeight: horizontal ? '100%' : 40,
        minWidth: horizontal ? 40 : 'auto',
        margin: horizontal ? '0 4px' : '4px 0',
        flex: horizontal ? '0 0 auto' : undefined,
        border: `2px dashed ${isActive ? '#0F4C5C' : '#D8D8D4'}`,
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isActive ? '#0F4C5C' : '#6F6F6B',
        fontSize: 11,
        background: isActive ? 'rgba(15,76,92,0.08)' : 'rgba(15,76,92,0.03)',
      }}
    >
      + here
    </div>
  );
}
