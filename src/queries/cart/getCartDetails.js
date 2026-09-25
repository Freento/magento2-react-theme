import { gql } from '@apollo/client';
import { CART_SHIPPING_ADDRESS_FIELDS } from './cartShippingAddressFields';
import { CART_BILLING_ADDRESS_FIELDS } from './cartBillingAddressFields';
import { CART_ITEM_FIELDS } from './cartItemFields';

export const GET_CART_DETAILS = gql`
  ${CART_SHIPPING_ADDRESS_FIELDS}
  ${CART_BILLING_ADDRESS_FIELDS}
  ${CART_ITEM_FIELDS}
  query getCartDetails($cartId: String!) {
    cart(cart_id: $cartId) {
      id
      items {
        ...CartItemFields
      }
      applied_coupons { code }
      prices {
        grand_total {
          currency
          value
        }
        subtotal_excluding_tax {
          currency
          value
        }
        subtotal_including_tax {
          currency
          value
        }
        applied_taxes {
          amount {
            currency
            value
          }
          label
        }
        discounts {
          amount {
            currency
            value
          }
          label
        }
      }
      shipping_addresses {
        ...CartShippingAddressFields
      }
      billing_address {
        ...CartBillingAddressFields
      }
    }
  }
`;
