import { gql } from '@apollo/client';

export const COMPARE_LIST_FIELDS = gql`
  fragment CompareListFields on CompareList {
    uid
    item_count
    attributes {
      code
      label
    }
    items {
      uid
      product {
        __typename
        id
        uid
        sku
        name
        url_key
        url_suffix
        stock_status
        small_image {
          w150: url(width: 150)
        }
        price_range {
          minimum_price {
            final_price {
              currency
              value
            }
          }
        }
      }
      attributes {
        code
        value
      }
    }
  }
`;
