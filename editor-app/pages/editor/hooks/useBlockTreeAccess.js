import {useCallback} from 'react';
import registry from 'editor-core/registry';
import {resolveBlockForDevices} from 'editor-core/renderer';
import {findBlock, findBlockLocation, ancestorsOf, holdsSystemBlock} from '../lib/blockTree.js';
import {deviceChain} from '../lib/hostBlocks.jsx';
import {AREA_KEYS, LOOKUP_ORDER, PAGE_AREA, isBarePage} from '../lib/areas.js';

// Reads and writes blocks in whichever region owns them. Every lookup walks the
// area list from lib/areas.js, so the page and the global blocks are handled by
// the same code path instead of one branch each.
export function useBlockTreeAccess({areas, setArea, selectedBlockId, device}) {
    const devices = deviceChain(device);

    const getBlocksFor = useCallback(
        (side) => areas[AREA_KEYS.includes(side) ? side : PAGE_AREA]?.blocks || [],
        [areas]
    );
    const setBlocksFor = useCallback(
        (side, next) => {
            setArea(AREA_KEYS.includes(side) ? side : PAGE_AREA, (prev) => ({
                ...prev,
                blocks: typeof next === 'function' ? next(prev?.blocks || []) : next,
            }));
        },
        [setArea]
    );

    // Which region a block id lives in. `root-page` is the canvas itself, not a
    // block, so it belongs to no region.
    const sideForBlockId = useCallback(
        (id) => {
            if (!id || id === 'root-page') return null;
            for (const key of LOOKUP_ORDER) {
                if (findBlock(areas[key]?.blocks || [], id)) return key;
            }
            return null;
        },
        [areas]
    );
    const findBlockById = useCallback(
        (id) => {
            if (!id) return null;
            for (const key of LOOKUP_ORDER) {
                const hit = findBlock(areas[key]?.blocks || [], id);
                if (hit) return hit;
            }
            return null;
        },
        [areas]
    );

    const activeTarget = sideForBlockId(selectedBlockId) || PAGE_AREA;

    const isDropAllowed = useCallback(
        (componentName, parentId, movingId, targetArea) => {
            const reg = registry[componentName];
            if (!reg) return true;
            // System blocks never come from the catalog.
            if (!movingId && reg.system) return false;
            // A page served while Magento is down cannot hold blocks that query it.
            if (reg.requiresBackend && isBarePage(areas[PAGE_AREA])) return false;
            if (movingId) {
                const from = sideForBlockId(movingId);
                // A system block (or a container holding one) can be rearranged
                // inside its own region but never carried into another one.
                // `targetArea` names the region when the drop lands on its root.
                const to = sideForBlockId(parentId) || targetArea || null;
                if (from && to && from !== to && holdsSystemBlock(findBlock(getBlocksFor(from), movingId))) {
                    return false;
                }
                const loc = from ? findBlockLocation(getBlocksFor(from), movingId, 'root-page') : null;
                if (loc && loc.parentId === parentId) return true;
            }
            const side = sideForBlockId(parentId);
            const parentBlock = side ? findBlock(getBlocksFor(side), parentId) : null;
            const parentName = parentBlock ? parentBlock.component : 'page';
            if (reg.allowedIn && !reg.allowedIn.includes(parentName)) return false;
            if (reg.disallowedAncestors?.length && parentBlock) {
                const banned = new Set(reg.disallowedAncestors);
                const chain = [parentBlock, ...ancestorsOf(getBlocksFor(side), parentBlock.id)];
                if (chain.some((b) => banned.has(b.component))) return false;
            }
            return true;
        },
        [sideForBlockId, getBlocksFor, areas]
    );

    const getCurrentBlocks = useCallback(() => getBlocksFor(activeTarget), [activeTarget, getBlocksFor]);
    const setCurrentBlocks = useCallback(
        (next) => setBlocksFor(activeTarget, next),
        [activeTarget, setBlocksFor]
    );

    const selectedBlockRaw = findBlockById(selectedBlockId);
    const selectedBlock = selectedBlockRaw
        ? resolveBlockForDevices(selectedBlockRaw, devices)
        : null;
    const selectedRegistry = selectedBlock ? registry[selectedBlock.component] : null;
    // A block under one that the style layer made a link renders no anchor of
    // its own — one link inside another is invalid HTML. Offering it a link
    // field would promise something the page cannot keep.
    const selectedInsideLink = selectedBlockId
        ? LOOKUP_ORDER.some((key) => ancestorsOf(areas[key]?.blocks || [], selectedBlockId).some((b) => !!b?.style?.link))
        : false;
    const currentBlocks = getCurrentBlocks();

    return {
        activeTarget,
        sideForBlockId,
        findBlockById,
        getBlocksFor,
        setBlocksFor,
        isDropAllowed,
        getCurrentBlocks,
        setCurrentBlocks,
        selectedBlockRaw,
        selectedBlock,
        selectedRegistry,
        selectedInsideLink,
        currentBlocks,
    };
}
