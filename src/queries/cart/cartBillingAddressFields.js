import { gql } from '@apollo/client';

export const CART_BILLING_ADDRESS_FIELDS = gql`
  fragment CartBillingAddressFields on BillingCartAddress {
    firstname
    lastname
    street
    city
    postcode
    telephone
    country {
      code
      label
    }
    region {
      code
      region_id
      label
    }
  }
`;
