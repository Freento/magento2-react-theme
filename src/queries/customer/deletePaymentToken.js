import { gql } from '@apollo/client';

export const DELETE_PAYMENT_TOKEN = gql`
  mutation deletePaymentToken($hash: String!) {
    deletePaymentToken(public_hash: $hash) {
      result
    }
  }
`;
