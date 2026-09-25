import { gql } from '@apollo/client';

export const CART_ITEM_FIELDS = gql`
  fragment CartItemFields on CartItemInterface {
    uid
    id
    product {
      __typename
      id
      uid
      name
      sku
      url_key
      url_suffix
      thumbnail {
        w150: url(width: 150)
      }
      price_range {
        minimum_price { final_price { currency value } }
        maximum_price { final_price { currency value } }
      }
      rating_summary
      review_count
      stock_status
    }
    quantity
    prices {
      price {
        currency
        value
      }
      row_total {
        currency
        value
      }
      total_item_discount {
        currency
        value
      }
    }
    ... on ConfigurableCartItem {
      configurable_options {
        option_label
        value_label
        configurable_product_option_value_uid
      }
      configured_variant {
        sku
        thumbnail {
          w150: url(width: 150)
        }
      }
    }
  }
`;
