import {useBlockTreeAccess} from './useBlockTreeAccess.js';
import {useBlockMutations} from './useBlockMutations.js';

export function useBlockActions({
                                    areas,
                                    setArea,
                                    selectedBlockId,
                                    setSelectedBlockId,
                                    setActiveTab,
                                    device,
                                    showToast,
                                }) {
    const access = useBlockTreeAccess({areas, setArea, selectedBlockId, device});

    const mutations = useBlockMutations({
        getCurrentBlocks: access.getCurrentBlocks,
        setCurrentBlocks: access.setCurrentBlocks,
        sideForBlockId: access.sideForBlockId,
        getBlocksFor: access.getBlocksFor,
        setBlocksFor: access.setBlocksFor,
        selectedBlockRaw: access.selectedBlockRaw,
        selectedBlockId,
        device,
        setSelectedBlockId,
        setActiveTab,
        showToast,
        isDropAllowed: access.isDropAllowed,
    });

    return {...access, ...mutations};
}
