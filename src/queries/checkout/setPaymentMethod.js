import { gql } from '@apollo/client';

export const SET_PAYMENT_METHOD = gql`
  mutation setPaymentMethodOnCart($cartId: String!, $paymentMethod: PaymentMethodInput!) {
    setPaymentMethodOnCart(input: {
      cart_id: $cartId
      payment_method: $paymentMethod
    }) {
      cart {
        id
        selected_payment_method {
          code
          title
        }
      }
    }
  }
`;
