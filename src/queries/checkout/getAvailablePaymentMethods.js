import { gql } from '@apollo/client';

export const GET_AVAILABLE_PAYMENT_METHODS = gql`
  query getAvailablePaymentMethods($cartId: String!) {
    cart(cart_id: $cartId) {
      id
      available_payment_methods {
        code
        title
      }
    }
  }
`;
