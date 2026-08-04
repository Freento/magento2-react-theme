import { gql } from '@apollo/client';

export const SET_BILLING_ADDRESS = gql`
  mutation setBillingAddress($cartId: String!, $billingAddress: CartAddressInput, $billingCustomerAddressId: Int, $sameAsShipping: Boolean!) {
    setBillingAddressOnCart(input: {
      cart_id: $cartId
      billing_address: {
        customer_address_id: $billingCustomerAddressId
        address: $billingAddress
        same_as_shipping: $sameAsShipping
      }
    }) {
      cart {
        id
        billing_address {
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
        }
      }
    }
  }
`;
