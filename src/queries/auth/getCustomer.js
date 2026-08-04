import { gql } from '@apollo/client';

export const GET_CUSTOMER = gql`
  query getCustomer {
    customer {
      id
      email
      firstname
      lastname
    }
  }
`;
