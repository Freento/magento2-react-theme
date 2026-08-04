import {useBlockTreeAccess} from './useBlockTreeAccess.js';
import {useBlockMutations} from './useBlockMutations.js';

export function useBlockActions({
                                    pageData,
                                    setPageData,
                                    footerData,
                                    setFooterData,
                                    selectedBlockId,
                                    setSelectedBlockId,
                                    setActiveTab,
                                    device,
                                }) {
    const access = useBlockTreeAccess({
        pageData,
        setPageData,
        footerData,
        setFooterData,
        selectedBlockId,
        device,
    });

    const mutations = useBlockMutations({
        getCurrentBlocks: access.getCurrentBlocks,
        setCurrentBlocks: access.setCurrentBlocks,
        selectedBlockRaw: access.selectedBlockRaw,
        selectedBlockId,
        device,
        setSelectedBlockId,
        setActiveTab,
    });

    return {...access, ...mutations};
}
