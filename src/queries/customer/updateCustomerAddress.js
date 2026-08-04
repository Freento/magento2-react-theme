import { gql } from '@apollo/client';

export const UPDATE_CUSTOMER_ADDRESS = gql`
  mutation updateCustomerAddress($id: Int!, $input: CustomerAddressInput!) {
    updateCustomerAddress(id: $id, input: $input) {
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
