import { gql } from '@apollo/client';
import { CART_SHIPPING_ADDRESS_FIELDS } from '../cart/cartShippingAddressFields';
import { CHECKOUT_CART_PRICES } from './cartPricesFragment';

export const SET_SHIPPING_METHOD = gql`
  ${CART_SHIPPING_ADDRESS_FIELDS}
  ${CHECKOUT_CART_PRICES}
  mutation setShippingMethodOnCart($cartId: String!, $carrierCode: String!, $methodCode: String!) {
    setShippingMethodsOnCart(input: {
      cart_id: $cartId
      shipping_methods: [{
        carrier_code: $carrierCode
        method_code: $methodCode
      }]
    }) {
      cart {
        id
        shipping_addresses {
          ...CartShippingAddressFields
        }
        prices {
          ...CheckoutCartPrices
        }
      }
    }
  }
`;
