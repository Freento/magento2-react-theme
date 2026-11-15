import { computeGridEmpties } from '../lib/grid.js';

export function GridGhosts({ block, dropTarget, onDropTargetChange, isDragging, devices }) {
  const empty = computeGridEmpties(block, devices);
  if (empty.length === 0) return null;
  const childrenCount = (block.children || []).length;
  return empty.map(({ r, c }) => {
    const isActive =
      dropTarget?.parentId === block.id &&
      dropTarget?.cell?.r === r &&
      dropTarget?.cell?.c === c;
    return (
      <div
        key={`ghost-${r}-${c}`}
        className="editor-grid-ghost flex items-center justify-center text-ed-text-soft text-[20px] font-light select-none [transition:all_0.12s] hover:text-ed-primary"
        style={{
          gridColumn: `${c}`,
          gridRow: `${r}`,
          minHeight: 80,
          border: isActive ? '2px solid #0F4C5C' : '1.5px dashed #9E9E99',
          borderRadius: 6,
          backgroundColor: isActive ? 'rgba(15, 76, 92, 0.08)' : 'rgba(15, 76, 92, 0.025)',
          backgroundImage: isActive
            ? undefined
            : 'repeating-linear-gradient(45deg, rgba(15, 76, 92, 0.04), rgba(15, 76, 92, 0.04) 6px, transparent 6px, transparent 12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isActive ? '#0F4C5C' : '#6F6F6B',
          fontSize: 20,
          pointerEvents: 'auto',
        }}
        onDragEnter={
          isDragging
            ? (e) => {
                e.preventDefault();
                e.stopPropagation();
                onDropTargetChange({
                  parentId: block.id,
                  index: childrenCount,
                  cell: { r, c },
                });
              }
            : undefined
        }
        onDragOver={
          isDragging
            ? (e) => {
                e.preventDefault();
                e.stopPropagation();
                onDropTargetChange({
                  parentId: block.id,
                  index: childrenCount,
                  cell: { r, c },
                });
              }
            : undefined
        }
      >
        <span>+</span>
      </div>
    );
  });
}
