import { gql } from '@apollo/client';

export const CREATE_CUSTOMER = gql`
  mutation createCustomer($input: CustomerInput!) {
    createCustomer(input: $input) {
      customer {
        id
        email
        firstname
        lastname
      }
    }
  }
`;
