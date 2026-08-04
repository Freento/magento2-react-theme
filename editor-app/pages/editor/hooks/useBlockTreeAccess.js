import {useCallback} from 'react';
import registry from 'editor-core/registry';
import {resolveBlockForDevices} from 'editor-core/renderer';
import {findBlock, ancestorsOf} from '../lib/blockTree.js';
import {deviceChain} from '../lib/hostBlocks.jsx';

export function useBlockTreeAccess({
                                       pageData,
                                       setPageData,
                                       footerData,
                                       setFooterData,
                                       selectedBlockId,
                                       device,
                                   }) {
    const devices = deviceChain(device);

    const selectionInFooter = useCallback(
        (id) => !!(footerData && id && findBlock(footerData.blocks || [], id)),
        [footerData, findBlock]
    );
    const activeTarget = selectionInFooter(selectedBlockId) ? 'footer' : 'page';

    const sideForBlockId = useCallback(
        (id) => {
            if (!id || id === 'root-page') return null;
            if (footerData?.blocks && findBlock(footerData.blocks, id)) return 'footer';
            if (pageData?.blocks && findBlock(pageData.blocks, id)) return 'page';
            return null;
        },
        [pageData, footerData, findBlock]
    );
    const getBlocksFor = useCallback(
        (side) => (side === 'footer' ? footerData?.blocks || [] : pageData?.blocks || []),
        [pageData, footerData]
    );
    const setBlocksFor = useCallback(
        (side, next) => {
            const setter = side === 'footer' ? setFooterData : setPageData;
            setter((prev) => ({
                ...prev,
                blocks: typeof next === 'function' ? next(prev?.blocks || []) : next,
            }));
        },
        []
    );


    const isDropAllowed = useCallback(
        (componentName, parentId) => {
            const reg = registry[componentName];
            if (!reg) return true;
            const parentBlock =
                parentId && parentId !== 'root-page'
                    ? findBlock(pageData?.blocks || [], parentId) ||
                    findBlock(footerData?.blocks || [], parentId)
                    : null;
            const parentName = parentBlock ? parentBlock.component : 'page';
            if (reg.allowedIn && !reg.allowedIn.includes(parentName)) return false;
            if (reg.disallowedAncestors?.length && parentBlock) {
                const banned = new Set(reg.disallowedAncestors);
                const chain = [
                    parentBlock,
                    ...ancestorsOf(pageData?.blocks || [], parentBlock.id),
                    ...ancestorsOf(footerData?.blocks || [], parentBlock.id),
                ];
                if (chain.some((b) => banned.has(b.component))) return false;
            }
            return true;
        },
        [pageData, footerData, findBlock, ancestorsOf]
    );

    const getCurrentBlocks = useCallback(() => {
        if (activeTarget === 'footer') return footerData?.blocks || [];
        return pageData?.blocks || [];
    }, [activeTarget, pageData, footerData]);
    const setCurrentBlocks = useCallback(
        (next) => {
            const apply = (prev) =>
                typeof next === 'function' ? next(prev.blocks || []) : next;
            if (activeTarget === 'footer') {
                setFooterData((prev) => ({...prev, blocks: apply(prev)}));
            } else {
                setPageData((prev) => ({...prev, blocks: apply(prev)}));
            }
        },
        [activeTarget]
    );

    const pageBlocksData = pageData?.blocks || [];
    const selectedBlockRaw = selectedBlockId
        ? findBlock(pageBlocksData, selectedBlockId) || findBlock(footerData?.blocks || [], selectedBlockId)
        : null;
    const selectedBlock = selectedBlockRaw
        ? resolveBlockForDevices(selectedBlockRaw, devices)
        : null;
    const selectedRegistry = selectedBlock ? registry[selectedBlock.component] : null;
    const currentBlocks = getCurrentBlocks();

    return {
        selectionInFooter,
        activeTarget,
        sideForBlockId,
        getBlocksFor,
        setBlocksFor,
        isDropAllowed,
        getCurrentBlocks,
        setCurrentBlocks,
        pageBlocksData,
        selectedBlockRaw,
        selectedBlock,
        selectedRegistry,
        currentBlocks,
    };
}
