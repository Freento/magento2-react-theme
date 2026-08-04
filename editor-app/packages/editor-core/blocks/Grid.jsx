import React from 'react';

export default function Grid({
  direction = 'grid',
  columns = 2,
  rows = 0,
  rowGap = 16,
  columnGap = 16,
  alignItems = 'stretch',
  justifyItems = 'stretch',
  children,
}) {
  const childCount = Math.max(1, React.Children.count(children));
  const asSize = (v) => (typeof v === 'number' ? `${v}px` : v || '0');

  let cols;
  let rowsN;
  if (direction === 'column') {
    cols = 1;
    rowsN = 0;
  } else if (direction === 'row') {
    cols = childCount;
    rowsN = 1;
  } else {
    cols = Math.max(1, Math.min(12, Number(columns) || 1));
    rowsN = Math.max(0, Math.min(12, Number(rows) || 0));
  }

  const templateRows = rowsN > 0 ? `repeat(${rowsN}, auto)` : undefined;
  const templateColumns = `repeat(${cols}, minmax(0, 1fr))`;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: templateColumns,
        gridTemplateRows: templateRows,
        gridAutoRows: rowsN > 0 ? undefined : 'auto',
        rowGap: asSize(rowGap),
        columnGap: asSize(columnGap),
        alignItems,
        justifyItems,
        width: '100%',
      }}
    >
      {children}
    </div>
  );
}
