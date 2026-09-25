import { gql } from '@apollo/client';
import { CART_SHIPPING_ADDRESS_FIELDS } from './cartShippingAddressFields';
import { CART_ITEM_FIELDS } from './cartItemFields';

export const UPDATE_CART_ITEMS = gql`
  ${CART_SHIPPING_ADDRESS_FIELDS}
  ${CART_ITEM_FIELDS}
  mutation updateCartItems($cartId: String!, $cartItems: [CartItemUpdateInput!]!) {
    updateCartItems(input: {
      cart_id: $cartId
      cart_items: $cartItems
    }) {
      cart {
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
  }
`;
