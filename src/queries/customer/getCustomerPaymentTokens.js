import { gql } from '@apollo/client';

export const GET_CUSTOMER_PAYMENT_TOKENS = gql`
  query getCustomerPaymentTokens {
    customerPaymentTokens {
      items {
        public_hash
        details
        payment_method_code
        type
      }
    }
  }
`;
