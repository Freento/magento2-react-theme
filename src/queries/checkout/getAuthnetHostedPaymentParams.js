import { gql } from '@apollo/client';

export const GET_AUTHNET_HOSTED_PAYMENT_PARAMS = gql`
  query authnetcimHostedPaymentFormParams($cartId: String!, $guestEmail: String) {
    authnetcimHostedPaymentFormParams(input: {
      cartId: $cartId
      method: authnetcim
      guestEmail: $guestEmail
    }) {
      iframeSessionId
      iframeAction
      iframeParams
    }
  }
`;
