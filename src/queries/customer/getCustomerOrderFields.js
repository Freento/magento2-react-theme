import { gql } from '@apollo/client';

export const GET_CUSTOMER_ORDER_FIELDS = gql`
  query getCustomerOrderFields {
    __type(name: "CustomerOrder") {
      name
      fields {
        name
      }
    }
  }
`;
