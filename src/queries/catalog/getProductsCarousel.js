import { gql } from '@apollo/client';
import { CONFIGURABLE_CARD_FIELDS } from './configurableCardFields';

export const GET_PRODUCTS_CAROUSEL = gql`
  ${CONFIGURABLE_CARD_FIELDS}
  query getProductsCarousel($filter: ProductAttributeFilterInput!, $pageSize: Int!) {
    products(
      filter: $filter,
      currentPage: 1,
      pageSize: $pageSize
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
`;
