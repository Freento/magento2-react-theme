import { gql } from '@apollo/client';

export const CART_SHIPPING_ADDRESS_FIELDS = gql`
  fragment CartShippingAddressFields on ShippingCartAddress {
    firstname
    lastname
    street
    city
    postcode
    telephone
    country {
      code
    }
    region {
      code
      region_id
      label
    }
    selected_shipping_method {
      amount {
        currency
        value
      }
      carrier_code
      carrier_title
      method_code
      method_title
    }
  }
`;
