import { gql } from '@apollo/client';
import { CART_SHIPPING_ADDRESS_FIELDS } from './cartShippingAddressFields';
import { CART_ITEM_FIELDS } from './cartItemFields';

export const MERGE_CARTS = gql`
  ${CART_SHIPPING_ADDRESS_FIELDS}
  ${CART_ITEM_FIELDS}
  mutation mergeCarts($sourceCartId: String!, $destinationCartId: String) {
    mergeCarts(source_cart_id: $sourceCartId, destination_cart_id: $destinationCartId) {
      id
      items {
        ...CartItemFields
      }
      applied_coupons { code }
      shipping_addresses {
        ...CartShippingAddressFields
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
