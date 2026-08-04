export function simulateGridPlacement(block) {
  const kids = block.children || [];
  const cols = Math.max(1, Number(block.props?.columns) || 1);
  const fixedRows = Math.max(0, Number(block.props?.rows) || 0);
  const occupied = new Set();
  const childCells = new Array(kids.length);
  const autoQueue = [];
  kids.forEach((c, i) => {
    let cs = Math.min(cols, Math.max(1, Number(c?.style?.colSpan) || 1));
    const rs = Math.max(1, Number(c?.style?.rowSpan) || 1);
    let cStart = Math.max(0, Number(c?.style?.colStart) || 0);
    let rStart = Math.max(0, Number(c?.style?.rowStart) || 0);
    if (cStart > cols) { cStart = 0; rStart = 0; }
    if (cStart > 0 && cStart + cs - 1 > cols) cs = cols - cStart + 1;
    if (cStart > 0 && rStart > 0) {
      for (let r = rStart; r < rStart + rs; r++) {
        for (let co = cStart; co < cStart + cs; co++) {
          occupied.add(`${r}-${co}`);
        }
      }
      childCells[i] = { r: rStart, c: cStart, cs, rs };
    } else {
      autoQueue.push({ i, cs, rs });
    }
  });
  const fits = (r, c, cs, rs) => {
    if (c + cs - 1 > cols) return false;
    for (let rr = r; rr < r + rs; rr++) {
      for (let cc = c; cc < c + cs; cc++) {
        if (occupied.has(`${rr}-${cc}`)) return false;
      }
    }
    return true;
  };
  for (const { i, cs, rs } of autoQueue) {
    let r = 1;
    let placed = false;
    while (!placed) {
      for (let c = 1; c <= cols - cs + 1 && !placed; c++) {
        if (fits(r, c, cs, rs)) {
          for (let rr = r; rr < r + rs; rr++) {
            for (let cc = c; cc < c + cs; cc++) {
              occupied.add(`${rr}-${cc}`);
            }
          }
          childCells[i] = { r, c, cs, rs };
          placed = true;
        }
      }
      r++;
      if (r > 500) break;
    }
  }
  let maxRow = 0;
  for (const key of occupied) {
    const r = parseInt(key.split('-')[0], 10);
    if (r > maxRow) maxRow = r;
  }
  const totalRows = fixedRows > 0 ? fixedRows : Math.max(maxRow, 1);
  const empty = [];
  for (let r = 1; r <= totalRows; r++) {
    for (let c = 1; c <= cols; c++) {
      if (!occupied.has(`${r}-${c}`)) empty.push({ r, c });
    }
  }
  return { empty, childCells, cols, totalRows };
}

export function computeGridEmpties(block) {
  return simulateGridPlacement(block).empty;
}

export function computeGridTailRow(block) {
  const kids = block.children || [];
  const cols = Math.max(1, Number(block.props?.columns) || 1);
  const fixedRows = Math.max(0, Number(block.props?.rows) || 0);
  if (fixedRows > 0) return [];
  let maxRow = 0;
  kids.forEach((c) => {
    const rs = Math.max(1, Number(c?.style?.rowSpan) || 1);
    const rStart = Math.max(0, Number(c?.style?.rowStart) || 0);
    const r = rStart > 0 ? rStart + rs - 1 : rs;
    if (r > maxRow) maxRow = r;
  });
  const tailRow = Math.max(1, maxRow) + 1;
  const cells = [];
  for (let c = 1; c <= cols; c++) cells.push({ r: tailRow, c });
  return cells;
}
