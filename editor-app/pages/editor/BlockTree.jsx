import { UI, BlockIcon } from '../../src/editor/Icon.jsx';
import registry from 'editor-core/registry';

export function BlockTree({
  currentBlocks,
  dragType,
  dragData,
  treeDropTarget,
  setTreeDropTarget,
  selectedBlockId,
  setHoveredTreeId,
  handleTreeDragStart,
  handleDragEnd,
  handleTreeDragOver,
  handleTreeDrop,
  handleSelect,
  duplicateBlock,
  deleteBlock,
}) {
  const renderTreeNodes = (blocks, depth) => {
    return blocks.map((block) => {
      const isSelf = dragType === 'reorder' && dragData === block.id;
      const showBefore = treeDropTarget?.blockId === block.id && treeDropTarget.position === 'before';
      const showAfter = treeDropTarget?.blockId === block.id && treeDropTarget.position === 'after';
      const showInside = treeDropTarget?.blockId === block.id && treeDropTarget.position === 'inside';
      return (
        <div key={block.id}>
          {showBefore && <div style={{ height: 2, background: '#2563eb', margin: '0 8px', borderRadius: 1 }} />}
          <div
            className={`tree-item${selectedBlockId === block.id ? ' selected' : ''}${isSelf ? ' dragging' : ''}`}
            style={{
              paddingLeft: 10 + depth * 16,
              outline: showInside ? '2px solid #2563eb' : 'none',
              outlineOffset: -2,
              borderRadius: showInside ? 6 : undefined,
            }}
            draggable
            onDragStart={(e) => handleTreeDragStart(e, block.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleTreeDragOver(e, block, currentBlocks)}
            onDrop={handleTreeDrop}
            onClick={() => handleSelect(block.id)}
            onMouseEnter={() => setHoveredTreeId(block.id)}
            onMouseLeave={() => setHoveredTreeId((prev) => (prev === block.id ? null : prev))}
          >
            <span className="tree-item-label">
              <span className="tree-item-icon"><BlockIcon name={registry[block.component]?.icon} size={14} /></span>
              {registry[block.component]?.label || block.component}
              {showInside && <span style={{ fontSize: 9, color: '#2563eb', marginLeft: 4 }}>← here</span>}
            </span>
            <span className="tree-item-actions">
              <button className="btn-icon" onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }} title="Duplicate block"><UI.Copy size={13} strokeWidth={1.75} /></button>
              <button className="btn-icon danger" onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }} title="Delete block"><UI.Close size={14} strokeWidth={2} /></button>
            </span>
          </div>
          {block.children && block.children.length > 0 && renderTreeNodes(block.children, depth + 1)}
          {showAfter && <div style={{ height: 2, background: '#2563eb', margin: '0 8px', borderRadius: 1 }} />}
        </div>
      );
    });
  };

  return (
    <div onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setTreeDropTarget(null); }}>
      {renderTreeNodes(currentBlocks, 0)}
      {currentBlocks.length === 0 && <div className="empty-state">No blocks</div>}
    </div>
  );
}
