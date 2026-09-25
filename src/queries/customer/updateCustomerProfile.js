import { gql } from '@apollo/client';

export const UPDATE_CUSTOMER_PROFILE = gql`
  mutation updateCustomer($input: CustomerInput!) {
    updateCustomer(input: $input) {
      customer {
        id
        email
        firstname
        lastname
        date_of_birth
        gender
        is_subscribed
      }
    }
  }
`;
