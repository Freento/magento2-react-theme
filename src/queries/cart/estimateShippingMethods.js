import { gql } from '@apollo/client';
import { CHECKOUT_CART_PRICES } from '../checkout/cartPricesFragment';
import { CART_SHIPPING_ADDRESS_FIELDS } from './cartShippingAddressFields';

export const ESTIMATE_SHIPPING_METHODS = gql`
  ${CHECKOUT_CART_PRICES}
  ${CART_SHIPPING_ADDRESS_FIELDS}
  mutation estimateShippingMethods($cartId: String!, $address: CartAddressInput!) {
    setShippingAddressesOnCart(input: {
      cart_id: $cartId
      shipping_addresses: [{ address: $address }]
    }) {
      cart {
        id
        shipping_addresses {
          ...CartShippingAddressFields
          available_shipping_methods {
            available
            carrier_code
            carrier_title
            method_code
            method_title
            amount {
              currency
              value
            }
          }
        }
        prices {
          ...CheckoutCartPrices
        }
      }
    }
  }
`;
