import { gql } from '@apollo/client';

export const GET_AVAILABLE_SHIPPING_METHODS = gql`
  query getAvailableShippingMethods($cartId: String!) {
    cart(cart_id: $cartId) {
      id
      shipping_addresses {
        firstname
        lastname
        street
        city
        region {
          code
          region_id
        }
        postcode
        country {
          code
        }
        telephone
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
          price_excl_tax {
            currency
            value
          }
        }
      }
    }
  }
`;
