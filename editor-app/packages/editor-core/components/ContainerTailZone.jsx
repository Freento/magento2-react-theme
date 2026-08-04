export function ContainerTailZone({ parentId, childrenCount, onDropTargetChange, dropTarget, horizontal }) {
  const isActive = dropTarget?.parentId === parentId && dropTarget?.index === childrenCount;
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDropTargetChange({ parentId, index: childrenCount });
      }}
      style={{
        minHeight: horizontal ? '100%' : 40,
        minWidth: horizontal ? 40 : 'auto',
        margin: horizontal ? '0 4px' : '4px 0',
        flex: horizontal ? '0 0 auto' : undefined,
        border: `2px dashed ${isActive ? '#0F4C5C' : '#D8D8D4'}`,
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isActive ? '#0F4C5C' : '#9A9A95',
        fontSize: 11,
        background: isActive ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.03)',
      }}
    >
      + here
    </div>
  );
}
