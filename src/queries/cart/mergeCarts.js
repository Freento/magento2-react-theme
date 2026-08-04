import { gql } from '@apollo/client';

export const MERGE_CARTS = gql`
  mutation mergeCarts($sourceCartId: String!, $destinationCartId: String) {
    mergeCarts(source_cart_id: $sourceCartId, destination_cart_id: $destinationCartId) {
      id
      items {
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
          total_item_discount {
            currency
            value
          }
        }
      }
      applied_coupons { code }
      applied_gift_cards {
        code
        applied_balance { currency value }
        current_balance { currency value }
      }
      shipping_addresses {
        selected_shipping_method {
          amount { currency value }
          carrier_code
          carrier_title
          method_code
          method_title
        }
      }
      prices {
        grand_total { currency value }
        subtotal_excluding_tax { currency value }
        subtotal_including_tax { currency value }
        applied_taxes { amount { currency value } label }
        discounts { amount { currency value } label }
      }
    }
  }
`;
