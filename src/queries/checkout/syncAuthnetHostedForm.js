import { gql } from '@apollo/client';

export const SYNC_AUTHNET_HOSTED_FORM = gql`
  mutation authnetcimSyncHostedForm($cartId: String!, $iframeSessionId: String!, $guestEmail: String) {
    authnetcimSyncHostedForm(input: {
      cartId: $cartId
      iframeSessionId: $iframeSessionId
      method: authnetcim
      source: checkout
      guestEmail: $guestEmail
    }) {
      card {
        id
        label
        selected
        new
        type
        cc_bin
        cc_last4
      }
    }
  }
`;
