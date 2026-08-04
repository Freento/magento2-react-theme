import { gql } from '@apollo/client';

export const GET_CATEGORY_PRODUCTS = gql`
    query getCategoryProducts(
        $filters: ProductAttributeFilterInput!
        $categoryUid: String!
        $currentPage: Int = 1
        $pageSize: Int = 20
        $sort: ProductAttributeSortInput
    ) {
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
        products(
            filter: $filters
            currentPage: $currentPage
            pageSize: $pageSize
            sort: $sort
        ) {
            items {
                __typename
                id
                uid
                sku
                name
                small_image {
                    w450: url(width: 450)
                }
                url_key
                url_suffix
                price_range {
                    minimum_price {
                        final_price {
                            currency
                            value
                        }
                    }
                }
                rating_summary
                review_count
                stock_status
            }
            total_count
            page_info {
                current_page
                page_size
                total_pages
            }
        }
    }
`;
