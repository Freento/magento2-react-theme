import registry from 'editor-core/registry';
import {generateId} from './color.js';
import {simulateGridPlacement} from 'editor-core/renderer';

export function findBlock(blocks, id) {
    for (const block of blocks) {
        if (block.id === id) return block;
        if (block.children) {
            const found = findBlock(block.children, id);
            if (found) return found;
        }
    }
    return null;
}

// A system block is a built-in component (see `system` in its definition):
// authors edit its settings, but only developers add or remove it.
export const isSystemBlock = (block) => !!registry[block?.component]?.system;
// True for the block itself or anything nested in it, so a container cannot be
// used to delete or copy the system block it holds.
export const holdsSystemBlock = (block) =>
    !!block && (isSystemBlock(block) || (block.children || []).some(holdsSystemBlock));
export const SYSTEM_BLOCK_NOTICE = 'This block contains a built-in component and cannot be deleted or duplicated';

export function ancestorsOf(blocks, targetId) {
    const path = [];
    const walk = (arr, trail) => {
        for (const b of arr) {
            if (b.id === targetId) {
                path.push(...trail);
                return true;
            }
            if (b.children && walk(b.children, [b, ...trail])) return true;
        }
        return false;
    };
    walk(blocks, []);
    return path;
}

export function cloneBlockDeep(block) {
    return {
        ...block,
        id: generateId(),
        props: {...(block.props || {})},
        style: {...(block.style || {})},
        ...(block.children ? {children: block.children.map(cloneBlockDeep)} : {}),
    };
}

export function removeBlockFromTree(blocks, blockId) {
    let removed = null;
    const filter = (arr) => {
        const result = [];
        for (const b of arr) {
            if (b.id === blockId) {
                removed = b;
                continue;
            }
            const newB = b.children ? {...b, children: filter(b.children)} : b;
            result.push(newB);
        }
        return result;
    };
    const newBlocks = filter(blocks);
    return [newBlocks, removed];
}

export function pruneEmptyColumns(blocks) {
    const out = [];
    for (const b of blocks) {
        const next = b.children ? {...b, children: pruneEmptyColumns(b.children)} : b;
        if (next.component === 'Column' && !(next.children || []).length) continue;
        out.push(next);
    }
    return out;
}

export function insertBlockInTree(blocks, parentId, index, block, rootId) {
    if (parentId === rootId) {
        const result = [...blocks];
        result.splice(index, 0, block);
        return result;
    }
    return blocks.map((b) => {
        if (b.id === parentId) {
            const children = [...(b.children || [])];
            children.splice(index, 0, block);
            return {...b, children};
        }
        if (b.children) return {...b, children: insertBlockInTree(b.children, parentId, index, block, rootId)};
        return b;
    });
}

export function findBlockLocation(blocks, blockId, parentId) {
    for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].id === blockId) return {parentId, index: i};
        if (blocks[i].children) {
            const found = findBlockLocation(blocks[i].children, blockId, blocks[i].id);
            if (found) return found;
        }
    }
    return null;
}

export function findBlockInTreeById(blocks, id) {
    for (const b of blocks) {
        if (b.id === id) return b;
        if (b.children) {
            const found = findBlockInTreeById(b.children, id);
            if (found) return found;
        }
    }
    return null;
}

export const applyCellPin = (block, cell) => {
    const style = {...(block.style || {})};
    if (cell) {
        style.colStart = cell.c;
        style.rowStart = cell.r;
    } else {
        delete style.colStart;
        delete style.rowStart;
    }
    return {...block, style};
};

export const dropRedundantCellPins = (tree, parentId) => {
    if (!parentId || parentId === 'root-page') return tree;
    const parent = findBlock(tree, parentId);
    if (!parent || parent.component !== 'Grid' || !parent.children?.length) return tree;
    const sim = simulateGridPlacement(parent);
    let mutated = false;
    const newKids = parent.children.map((child, i) => {
        const cc = sim.childCells[i];
        const cur = child.style || {};
        if (!cc || cur.colStart == null || cur.rowStart == null) return child;
        if (Number(cur.colStart) !== cc.c || Number(cur.rowStart) !== cc.r) return child;
        mutated = true;
        const style = {...cur};
        delete style.colStart;
        delete style.rowStart;
        return {...child, style};
    });
    if (!mutated) return tree;
    const replace = (arr) => arr.map((b) => {
        if (b.id === parent.id) return {...b, children: newKids};
        if (b.children) return {...b, children: replace(b.children)};
        return b;
    });
    return replace(tree);
};

export const pinSameCellSiblings = (tree, parentId, cell) => {
    if (!cell || parentId === 'root-page') return tree;
    const parent = findBlock(tree, parentId);
    if (!parent || parent.component !== 'Grid' || !parent.children?.length) return tree;
    const sim = simulateGridPlacement(parent);
    let mutated = false;
    const newKids = parent.children.map((child, i) => {
        const cc = sim.childCells[i];
        if (!cc) return child;
        if (cc.r !== cell.r || cc.c !== cell.c) return child;
        const cur = child.style || {};
        if (Number(cur.colStart) === cell.c && Number(cur.rowStart) === cell.r) return child;
        mutated = true;
        return {...child, style: {...cur, colStart: cell.c, rowStart: cell.r}};
    });
    if (!mutated) return tree;
    const replace = (arr) => arr.map((b) => {
        if (b.id === parent.id) return {...b, children: newKids};
        if (b.children) return {...b, children: replace(b.children)};
        return b;
    });
    return replace(tree);
};
