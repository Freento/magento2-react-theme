import {getClientApolloClient} from '@host/apollo/client';
import {GET_CATEGORIES} from '@host/queries/menu';

// The Magento category tree is small and rarely changes, so it's fetched once
// and shared across every editor field that needs it (the category picker and
// the products-count slider both read from here — one request, not two).
let cachedRoots = null;
let inflight = null;

export function loadCategoryRoots() {
    if (cachedRoots) return Promise.resolve(cachedRoots);
    if (!inflight) {
        inflight = getClientApolloClient()
            .query({query: GET_CATEGORIES, fetchPolicy: 'cache-first'})
            .then((res) => {
                cachedRoots = (res.data?.categoryList || []).flatMap((c) => c.children || []);
                return cachedRoots;
            })
            .catch((err) => {
                inflight = null;
                throw err;
            });
    }
    return inflight;
}

export function getCachedRoots() {
    return cachedRoots;
}

export function findCategory(nodes, id) {
    for (const node of nodes) {
        if (String(node.id) === String(id)) return node;
        const found = node.children ? findCategory(node.children, id) : null;
        if (found) return found;
    }
    return null;
}
