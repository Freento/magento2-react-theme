import { resolveBlockForDevices } from './devices.js';

// The parent block reaching here is already device-resolved, but its children
// are not: resolveBlockForDevices only merges the block's own props/style. A
// child whose grid cell is overridden for tablet would otherwise be simulated
// with its desktop cell, so the editor's ghosts and stacks would disagree with
// what the browser actually lays out.
const resolvedKids = (block, devices) => {
  const kids = block.children || [];
  if (!devices || !devices.length) return kids;
  return kids.map((c) => (c ? resolveBlockForDevices(c, devices) : c));
};

export function simulateGridPlacement(block, devices) {
  const kids = resolvedKids(block, devices);
  const cols = Math.max(1, Number(block.props?.columns) || 1);
  const rows = Math.max(1, Number(block.props?.rows) || 1);
  const occupied = new Set();
  const childCells = new Array(kids.length);
  const autoQueue = [];
  kids.forEach((c, i) => {
    let cStart = Math.max(0, Number(c?.style?.colStart) || 0);
    let rStart = Math.max(0, Number(c?.style?.rowStart) || 0);
    if (cStart > cols) { cStart = 0; rStart = 0; }
    if (cStart > 0 && rStart > 0) {
      occupied.add(`${rStart}-${cStart}`);
      childCells[i] = { r: rStart, c: cStart };
    } else {
      autoQueue.push(i);
    }
  });
  for (const i of autoQueue) {
    let r = 1;
    let placed = false;
    while (!placed) {
      for (let c = 1; c <= cols && !placed; c++) {
        if (!occupied.has(`${r}-${c}`)) {
          occupied.add(`${r}-${c}`);
          childCells[i] = { r, c };
          placed = true;
        }
      }
      r++;
      if (r > 500) break;
    }
  }
  const totalRows = rows;
  const empty = [];
  for (let r = 1; r <= totalRows; r++) {
    for (let c = 1; c <= cols; c++) {
      if (!occupied.has(`${r}-${c}`)) empty.push({ r, c });
    }
  }
  return { empty, childCells, cols, totalRows };
}

export function computeGridEmpties(block, devices) {
  return simulateGridPlacement(block, devices).empty;
}
