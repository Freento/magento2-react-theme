import { gql } from '@apollo/client';

export const DELETE_CUSTOMER_ADDRESS = gql`
  mutation deleteCustomerAddress($id: Int!) {
    deleteCustomerAddress(id: $id)
  }
`;
