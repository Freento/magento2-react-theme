import { gql } from '@apollo/client';

export const CREATE_CUSTOMER_ADDRESS = gql`
  mutation createCustomerAddress($input: CustomerAddressInput!) {
    createCustomerAddress(input: $input) {
      id
      firstname
      lastname
      street
      city
      region {
        region
        region_id
      }
      postcode
      country_code
      telephone
      company
      default_shipping
      default_billing
    }
  }
`;
