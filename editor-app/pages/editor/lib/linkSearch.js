import {gql} from '@apollo/client';
import {getClientApolloClient} from '@host/apollo/client';

const LINK_SEARCH = gql`
    query editorLinkSearch($text: String!) {
        categories(filters: {name: {match: $text}}, pageSize: 3) {
            items { uid name url_path url_suffix }
        }
        products(search: $text, currentPage: 1, pageSize: 4) {
            items { uid name url_key url_suffix }
        }
    }
`;

/**
 * Finds store categories and products whose name matches the text, as link
 * targets with storefront paths.
 *
 * @param {string} text
 * @returns {Promise<{group: string, title: string, path: string}[]>}
 */
export async function searchStoreLinks(text) {
    const res = await getClientApolloClient().query({query: LINK_SEARCH, variables: {text}, fetchPolicy: 'cache-first'});
    const categories = (res.data?.categories?.items || [])
        .filter((c) => c.url_path)
        .map((c) => ({group: 'Categories', title: c.name, path: `/${c.url_path}${c.url_suffix || ''}`}));
    const products = (res.data?.products?.items || [])
        .filter((p) => p.url_key)
        .map((p) => ({group: 'Products', title: p.name, path: `/${p.url_key}${p.url_suffix || ''}`}));
    return [...products, ...categories];
}
