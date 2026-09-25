import {useCallback} from 'react';
import registry from 'editor-core/registry';
import {cloneBlockDeep} from '../lib/blockTree.js';
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
                                  }) {
    const handleSelect = useCallback((id, options = {}) => {
        setSelectedBlockId(id);
        if (!options.keepTab) setActiveTab('settings');
        if (options.scrollIntoView && id) {
            let attempts = 0;
            const tryScroll = () => {
                const el = document.querySelector(`[data-block-id="${id}"]`);
                if (el) el.scrollIntoView({behavior: 'smooth', block: 'center'});
                else if (++attempts < 10) requestAnimationFrame(tryScroll);
            };
            requestAnimationFrame(tryScroll);
        }
    }, []);

    const addBlock = useCallback(
        (componentName) => {
            const reg = registry[componentName];
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

    const deleteBlock = useCallback(
        (id) => {
            const removeFromTree = (blocks) =>
                blocks
                    .filter((b) => b.id !== id)
                    .map((b) => (b.children ? {...b, children: removeFromTree(b.children)} : b));
            const side = sideForBlockId(id);
            if (side) setBlocksFor(side, removeFromTree(getBlocksFor(side)));
            else setCurrentBlocks(removeFromTree(getCurrentBlocks()));
            if (selectedBlockId === id) setSelectedBlockId(null);
        },
        [getCurrentBlocks, setCurrentBlocks, sideForBlockId, getBlocksFor, setBlocksFor, selectedBlockId]
    );


    const duplicateBlock = useCallback(
        (id) => {
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
            if (side) setBlocksFor(side, dupInTree(getBlocksFor(side), null));
            else setCurrentBlocks(dupInTree(getCurrentBlocks(), null));
            if (inserted) setSelectedBlockId(inserted.id);
        },
        [getCurrentBlocks, setCurrentBlocks, sideForBlockId, getBlocksFor, setBlocksFor, cloneBlockDeep]
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
            setCurrentBlocks((prev) => upd(prev));
        },
        [device, setCurrentBlocks]
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
        writeField,
        updateBlockProp,
        updateBlockStyle,
        patchBlockStyle,
        hasOverride,
        resetOverride,
    };
}
