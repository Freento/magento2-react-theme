import { gql } from '@apollo/client';

export const SET_SHIPPING_ADDRESS_AND_EMAIL = gql`
  mutation setShippingAddressAndEmail($cartId: String!, $shippingAddress: CartAddressInput, $customerAddressId: Int, $email: String!) {
    setGuestEmailOnCart(input: {
      cart_id: $cartId
      email: $email
    }) {
      cart {
        id
        email
      }
    }
    setShippingAddressesOnCart(input: {
      cart_id: $cartId
      shipping_addresses: [{
        customer_address_id: $customerAddressId
        address: $shippingAddress
      }]
    }) {
      cart {
        id
        shipping_addresses {
          firstname
          lastname
          street
          city
          region {
            code
            label
          }
          postcode
          country {
            code
            label
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
          }
        }
      }
    }
  }
`;
