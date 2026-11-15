import {useCallback} from 'react';
import registry from 'editor-core/registry';
import { readCopiedBlock, writeCopiedBlock } from 'editor-core/lib/blockClipboard';
import {cloneBlockDeep, pruneEmptyColumns, findBlock, findBlockLocation, insertBlockInTree, holdsSystemBlock, SYSTEM_BLOCK_NOTICE} from '../lib/blockTree.js';
import {generateId} from '../lib/color.js';

export function useBlockMutations({
                                      getCurrentBlocks,
                                      setCurrentBlocks,
                                      sideForBlockId,
                                      getBlocksFor,
                                      setBlocksFor,
                                      selectedBlockRaw,
                                      selectedBlockId,
                                      device,
                                      setSelectedBlockId,
                                      setActiveTab,
                                      showToast,
                                      isDropAllowed,
                                  }) {
    const handleSelect = useCallback((id) => {
        setSelectedBlockId(id);
        setActiveTab('settings');
    }, []);

    const addBlock = useCallback(
        (componentName) => {
            const reg = registry[componentName];
            if (!reg || reg.system) return;
            const newBlock = {
                id: generateId(),
                component: componentName,
                props: {...reg.defaultProps},
                style: {},
                ...(reg.acceptsChildren ? {children: []} : {}),
            };
            setCurrentBlocks([...getCurrentBlocks(), newBlock]);
            setSelectedBlockId(newBlock.id);
            setActiveTab('settings');
            let attempts = 0;
            const tryScroll = () => {
                const el = document.querySelector(`[data-block-id="${newBlock.id}"]`);
                if (el) {
                    el.scrollIntoView({behavior: 'smooth', block: 'center'});
                } else if (++attempts < 10) {
                    requestAnimationFrame(tryScroll);
                }
            };
            requestAnimationFrame(tryScroll);
        },
        [getCurrentBlocks, setCurrentBlocks]
    );

    // Deleting or copying is refused for a system block and for any container
    // that holds one; the buttons are hidden too, this covers every other path.
    const isProtected = useCallback(
        (id) => {
            const side = sideForBlockId(id);
            const block = side ? findBlock(getBlocksFor(side), id) : null;
            if (!holdsSystemBlock(block)) return false;
            showToast?.(SYSTEM_BLOCK_NOTICE, 'info');
            return true;
        },
        [sideForBlockId, getBlocksFor, showToast]
    );

    const deleteBlock = useCallback(
        (id) => {
            if (isProtected(id)) return;
            const removeFromTree = (blocks) =>
                blocks
                    .filter((b) => b.id !== id)
                    .map((b) => (b.children ? {...b, children: removeFromTree(b.children)} : b));
            const side = sideForBlockId(id);
            setBlocksFor(side, pruneEmptyColumns(removeFromTree(getBlocksFor(side))));
            if (selectedBlockId === id) setSelectedBlockId(null);
        },
        [sideForBlockId, getBlocksFor, setBlocksFor, selectedBlockId, isProtected]
    );


    const duplicateBlock = useCallback(
        (id) => {
            if (isProtected(id)) return;
            let inserted = null;
            const dupInTree = (blocks, parentComponent) => {
                const out = [];
                for (const b of blocks) {
                    out.push(b.children ? {...b, children: dupInTree(b.children, b.component)} : b);
                    if (b.id === id) {
                        const clone = cloneBlockDeep(b);
                        if (parentComponent === 'Grid' && clone.style) {
                            const s = {...clone.style};
                            delete s.colStart;
                            delete s.rowStart;
                            clone.style = s;
                        }
                        out.push(clone);
                        inserted = clone;
                    }
                }
                return out;
            };
            const side = sideForBlockId(id);
            setBlocksFor(side, dupInTree(getBlocksFor(side), null));
            if (inserted) setSelectedBlockId(inserted.id);
        },
        [sideForBlockId, getBlocksFor, setBlocksFor, cloneBlockDeep, isProtected]
    );

    const copyBlock = useCallback(
        (id = selectedBlockId) => {
            if (!id) return false;
            const side = sideForBlockId(id);
            const block = side ? findBlock(getBlocksFor(side), id) : null;
            if (!block) return false;
            if (holdsSystemBlock(block)) { showToast?.(SYSTEM_BLOCK_NOTICE, 'info'); return false; }
            if (!writeCopiedBlock(block)) return false;
            showToast?.(`${registry[block.component]?.label || block.component} copied`, 'success', 1800);
            return true;
        },
        [selectedBlockId, sideForBlockId, getBlocksFor, showToast]
    );

    const cutBlock = useCallback(
        (id = selectedBlockId) => {
            if (!id || !copyBlock(id)) return false;
            deleteBlock(id);
            return true;
        },
        [selectedBlockId, copyBlock, deleteBlock]
    );

    const pasteBlock = useCallback(
        (targetId = selectedBlockId) => {
            const copied = readCopiedBlock();
            if (!copied) { showToast?.('Nothing to paste', 'info', 1800); return false; }
            const rootId = 'root-page';
            let side = targetId ? sideForBlockId(targetId) : null;
            let blocks = side ? getBlocksFor(side) : getCurrentBlocks();
            let loc = targetId ? findBlockLocation(blocks, targetId, rootId) : null;
            if (!loc) { side = null; blocks = getCurrentBlocks(); loc = {parentId: rootId, index: blocks.length - 1}; }
            if (isDropAllowed && !isDropAllowed(copied.component, loc.parentId === rootId ? null : loc.parentId)) {
                showToast?.(`${registry[copied.component]?.label || copied.component} cannot go here`, 'error', 4000);
                return false;
            }
            const block = cloneBlockDeep(copied);
            if (loc.parentId !== rootId && block.style) {
                const s = {...block.style};
                delete s.colStart;
                delete s.rowStart;
                block.style = s;
            }
            const next = insertBlockInTree(blocks, loc.parentId, loc.index + 1, block, rootId);
            if (side) setBlocksFor(side, next);
            else setCurrentBlocks(next);
            setSelectedBlockId(block.id);
            setActiveTab?.('settings');
            return true;
        },
        [selectedBlockId, sideForBlockId, getBlocksFor, getCurrentBlocks, setBlocksFor, setCurrentBlocks, setSelectedBlockId, setActiveTab, showToast, isDropAllowed]
    );

    const writeField = useCallback(
        (id, target, mutate) => {
            const upd = (blocks) =>
                blocks.map((b) => {
                    if (b.id === id) {
                        if (device === 'desktop') {
                            return {...b, [target]: mutate(b[target] || {})};
                        }
                        const resp = b.responsive || {};
                        const cur = resp[device] || {};
                        const nextSub = mutate(cur[target] || {});
                        return {
                            ...b,
                            responsive: {
                                ...resp,
                                [device]: {...cur, [target]: nextSub},
                            },
                        };
                    }
                    if (b.children) return {...b, children: upd(b.children)};
                    return b;
                });
            const side = sideForBlockId(id);
            if (side) setBlocksFor(side, (prev) => upd(prev));
            else setCurrentBlocks((prev) => upd(prev));
        },
        [device, sideForBlockId, setBlocksFor, setCurrentBlocks]
    );

    const updateBlockProp = useCallback(
        (id, key, value) => {
            writeField(id, 'props', (prev) => ({...prev, [key]: value}));
        },
        [writeField]
    );

    const updateBlockStyle = useCallback(
        (id, key, value) => {
            writeField(id, 'style', (prev) => ({...prev, [key]: value}));
        },
        [writeField]
    );

    // Apply several style keys at once. Keys whose value is `undefined` are
    // deleted from the style object entirely (so they don't linger as "0"s).
    const patchBlockStyle = useCallback(
        (id, patch) => {
            writeField(id, 'style', (prev) => {
                const next = {...prev};
                for (const [k, v] of Object.entries(patch)) {
                    if (v === undefined) delete next[k];
                    else next[k] = v;
                }
                return next;
            });
        },
        [writeField]
    );

    const hasOverride = useCallback(
        (target, key) => {
            if (!selectedBlockRaw || device === 'desktop') return false;
            const over = selectedBlockRaw.responsive?.[device]?.[target];
            return over && key in over;
        },
        [selectedBlockRaw, device]
    );

    const resetOverride = useCallback(
        (target, key) => {
            if (!selectedBlockRaw || device === 'desktop') return;
            const upd = (blocks) =>
                blocks.map((b) => {
                    if (b.id === selectedBlockRaw.id) {
                        const resp = {...(b.responsive || {})};
                        const cur = {...(resp[device] || {})};
                        if (cur[target]) {
                            const nextSub = {...cur[target]};
                            delete nextSub[key];
                            if (Object.keys(nextSub).length) cur[target] = nextSub;
                            else delete cur[target];
                        }
                        if (Object.keys(cur).length) resp[device] = cur;
                        else delete resp[device];
                        const next = {...b};
                        if (Object.keys(resp).length) next.responsive = resp;
                        else delete next.responsive;
                        return next;
                    }
                    if (b.children) return {...b, children: upd(b.children)};
                    return b;
                });
            setCurrentBlocks(upd(getCurrentBlocks()));
        },
        [selectedBlockRaw, device, getCurrentBlocks, setCurrentBlocks]
    );

    return {
        handleSelect,
        addBlock,
        deleteBlock,
        duplicateBlock,
        copyBlock,
        cutBlock,
        pasteBlock,
        writeField,
        updateBlockProp,
        updateBlockStyle,
        patchBlockStyle,
        hasOverride,
        resetOverride,
    };
}
