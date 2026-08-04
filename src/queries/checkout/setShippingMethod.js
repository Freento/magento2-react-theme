import { gql } from '@apollo/client';

export const SET_SHIPPING_METHOD = gql`
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
          selected_shipping_method {
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
          grand_total {
            currency
            value
          }
          subtotal_excluding_tax {
            currency
            value
          }
        }
      }
    }
  }
`;
