import * as defaultBlocks from './blocks/index-runtime';
import registry from './registry-runtime.js';
import { resolveBlockForDevices } from './lib/devices.js';
import { simulateGridPlacement } from './lib/grid.js';
import { CellStackWrapper } from './components/CellStackWrapper.jsx';
import { BlockWrapper } from './components/BlockWrapper.jsx';
import { GridGhosts } from './components/GridGhosts.jsx';
import { ContainerTailZone } from './components/ContainerTailZone.jsx';
import { EmptyDropZone } from './components/EmptyDropZone.jsx';

export { BREAKPOINTS, activeDevicesFromWidth, useActiveDevices, resolveBlockForDevices } from './lib/devices.js';
export { simulateGridPlacement } from './lib/grid.js';

export function renderBlock(rawBlock, index, parentId, options = {}) {
  const blocks = options.blocks ? { ...defaultBlocks, ...options.blocks } : defaultBlocks;
  const Component = blocks[rawBlock.component];
  if (!Component) {
    return <div key={rawBlock.id} style={{ padding: 8, background: '#fee', color: '#c00', fontSize: 12 }}>Unknown: {rawBlock.component}</div>;
  }

  let block = options.devices && options.devices.length
    ? resolveBlockForDevices(rawBlock, options.devices)
    : rawBlock;

  const isEditing = !!options.onSelect;
  const isGrid = block.component === 'Grid';
  const gridLinear = isGrid && (block.props?.direction === 'column' || block.props?.direction === 'row');
  const gridCols = isGrid ? Math.max(1, Number(block.props?.columns) || 1) : null;
  const childOptions = {
    ...options,
    inGrid: isGrid,
    horizontal: isGrid,
    gridLinear,
    gridCols,
    totalCount: (block.children || []).length,
  };
  let childCells = null;
  if (isGrid && !gridLinear) {
    childCells = simulateGridPlacement(block).childCells;
  }
  let childElements;
  if (childCells) {
    const groups = new Map();
    childCells.forEach((cell, i) => {
      if (!cell) return;
      const key = `${cell.r}-${cell.c}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(i);
    });
    const kids = block.children || [];
    const seen = new Set();
    childElements = [];
    kids.forEach((child, i) => {
      if (seen.has(i)) return;
      const cell = childCells[i];
      if (!cell) {
        childElements.push(renderBlock(child, i, block.id, { ...childOptions, myCell: cell }));
        seen.add(i);
        return;
      }
      const group = groups.get(`${cell.r}-${cell.c}`);
      if (group.length === 1) {
        childElements.push(renderBlock(child, i, block.id, { ...childOptions, myCell: cell }));
        seen.add(i);
        return;
      }
      childElements.push(
        <CellStackWrapper
          key={`stack-${cell.r}-${cell.c}`}
          parentId={block.id}
          cell={cell}
          group={group}
          kids={kids}
          childOptions={childOptions}
          options={options}
          renderBlock={renderBlock}
        />
      );
      group.forEach((idx) => seen.add(idx));
    });
  } else {
    childElements = block.children?.map((child, i) =>
      renderBlock(child, i, block.id, { ...childOptions })
    );
  }

  const editorMeta = isEditing
    ? {
        blockId: block.id,
        isSelected: options.selectedId === block.id,
        onUpdateProp: options.onUpdateProp,
      }
    : null;

  return (
    <BlockWrapper key={block.id} block={block} index={index} parentId={parentId} {...options}>
      <Component {...block.props} {...(editorMeta ? { _editor: editorMeta } : {})}>
        {childElements}
        {isEditing && isGrid && (!options.validateDrop || options.validateDrop(block.id)) && (
          <GridGhosts
            block={block}
            dropTarget={options.dropTarget}
            onDropTargetChange={options.onDropTargetChange}
            isDragging={options.isDragging}
          />
        )}
        {options.isDragging && !isGrid && registry[block.component]?.acceptsChildren &&
         (!options.validateDrop || options.validateDrop(block.id)) && (
          <ContainerTailZone
            parentId={block.id}
            childrenCount={(block.children || []).length}
            onDropTargetChange={options.onDropTargetChange}
            dropTarget={options.dropTarget}
            horizontal={isRowParent}
          />
        )}
      </Component>
    </BlockWrapper>
  );
}

function renderBlockList(blockList, options = {}, targetName, parentId) {
  const { isDragging, editingTarget } = options;
  const active = isDragging && editingTarget === targetName;
  const listOptions = active ? { ...options, totalCount: blockList.length } : { ...options, isDragging: false };

  const dropAllowedHere = !options.validateDrop || options.validateDrop(parentId === 'root-page' ? null : parentId);

  if (blockList.length === 0) {
    return active && dropAllowedHere
      ? <EmptyDropZone isDragging={isDragging} dropTarget={options.dropTarget} parentId={parentId} onDropTargetChange={options.onDropTargetChange} />
      : null;
  }

  const children = blockList.map((block, index) => renderBlock(block, index, parentId, listOptions));
  if (active && dropAllowedHere) {
    children.push(
      <ContainerTailZone
        key="__tail__"
        parentId={parentId}
        childrenCount={blockList.length}
        onDropTargetChange={options.onDropTargetChange}
        dropTarget={options.dropTarget}
        horizontal={false}
      />
    );
  }
  return children;
}

function wrapDropOptions(options) {
  if (!options.validateDrop || !options.onDropTargetChange) return options;
  const innerSet = options.onDropTargetChange;
  const validate = options.validateDrop;
  return {
    ...options,
    onDropTargetChange: (target) => {
      if (target && !validate(target)) {
        innerSet(null);
      } else {
        innerSet(target);
      }
    },
  };
}

export function renderPage(page, options = {}) {
  const targetName = options.editingTarget || 'page';
  const opts = wrapDropOptions(options);
  return (
    <div
      className="editor-core-page"
      style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', ...(page?.style || {}) }}
    >
      {renderBlockList(page?.blocks || [], opts, targetName, 'root-page')}
    </div>
  );
}

export function renderPageBlocks(page, options = {}) {
  const targetName = options.editingTarget || 'page';
  const opts = wrapDropOptions(options);
  return renderBlockList(page?.blocks || [], opts, targetName, 'root-page');
}
