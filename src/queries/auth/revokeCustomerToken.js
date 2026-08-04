import { gql } from '@apollo/client';

export const REVOKE_CUSTOMER_TOKEN = gql`
  mutation revokeCustomerToken {
    revokeCustomerToken {
      result
    }
  }
`;
