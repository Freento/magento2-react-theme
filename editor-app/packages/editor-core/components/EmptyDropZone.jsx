export function EmptyDropZone({ isDragging, dropTarget, parentId, onDropTargetChange }) {
  if (!isDragging) return null;
  const active = dropTarget?.parentId === parentId && dropTarget?.index === 0;
  return (
    <div
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); onDropTargetChange({ parentId, index: 0 }); }}
      style={{
        height: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: active ? '2px solid #0F4C5C' : '2px dashed #ccc',
        borderRadius: 8, margin: 16, color: '#999', fontSize: 13,
        transition: 'all 0.15s',
      }}
    >
      Drop block here
    </div>
  );
}
