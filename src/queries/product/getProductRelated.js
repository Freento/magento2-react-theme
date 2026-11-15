import { gql } from '@apollo/client';
import { CONFIGURABLE_CARD_FIELDS } from '../catalog/configurableCardFields';

export const GET_PRODUCT_RELATED = gql`
    ${CONFIGURABLE_CARD_FIELDS}
    query getProductRelated($urlKey: String!) {
        products(filter: { url_key: { eq: $urlKey } }) {
            items {
                id
                uid
                url_key
                related_products {
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
                            final_price { currency value }
                        }
                    }
                    rating_summary
                    review_count
                    stock_status
                    ...ConfigurableCardFields
                }
            }
        }
    }
`;
