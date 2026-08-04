import { gql } from '@apollo/client';

export const GET_AUTOCOMPLETE_RESULTS = gql`
    query getAutocompleteResults($inputText: String!) {
        products(search: $inputText, currentPage: 1, pageSize: 5) {
            items {
                id
                uid
                sku
                name
                thumbnail {
                    w150: url(width: 150)
                }
                url_key
                url_suffix
                price_range {
                    maximum_price {
                        final_price { currency value }
                    }
                }
            }
            total_count
        }
    }
`;
