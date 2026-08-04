import { gql } from '@apollo/client';

export const GET_SEARCH_RESULTS = gql`
    query getSearchResults($inputText: String!, $currentPage: Int, $pageSize: Int, $filters: ProductAttributeFilterInput, $sort: ProductAttributeSortInput) {
        products(search: $inputText, currentPage: $currentPage, pageSize: $pageSize, filter: $filters, sort: $sort) {
            aggregations {
                label
                count
                attribute_code
                options {
                    label
                    value
                    count
                }
                position
            }
            items {
                id
                uid
                sku
                name
                small_image {
                    w450: url(width: 450)
                }
                url_key
                url_suffix
                price {
                    regularPrice {
                        amount {
                            value
                            currency
                        }
                    }
                }
                price_range {
                    minimum_price {
                        final_price {
                            currency
                            value
                        }
                        discount {
                            amount_off
                        }
                    }
                }
                rating_summary
                review_count
                stock_status
                __typename
            }
            page_info {
                current_page
                page_size
                total_pages
            }
            total_count
        }
    }
`;
