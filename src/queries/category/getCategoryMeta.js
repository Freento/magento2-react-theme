import { gql } from '@apollo/client';

/**
 * The `categoryList` half of GET_CATEGORY_PRODUCTS on its own.
 *
 * A category whose route area hides the product list still needs its name and
 * breadcrumb trail; without this it would pay for a page of products it never
 * renders.
 */
export const GET_CATEGORY_META = gql`
    query getCategoryMeta($categoryUid: String!) {
        categoryList(filters: { category_uid: { eq: $categoryUid } }) {
            id
            uid
            name
            url_path
            url_suffix
            breadcrumbs {
                category_id
                category_name
                category_url_path
                category_level
            }
        }
    }
`;
