import { gql } from '@apollo/client';

export const CREATE_PAYPAL_EXPRESS_TOKEN = gql`
  mutation createPaypalExpressToken(
    $cartId: String!
    $code: String!
    $express_button: Boolean!
    $urls: PaypalExpressUrlsInput!
    $use_paypal_credit: Boolean
  ) {
    createPaypalExpressToken(input: {
      cart_id: $cartId
      code: $code
      express_button: $express_button
      urls: $urls
      use_paypal_credit: $use_paypal_credit
    }) {
      token
      paypal_urls {
        start
        edit
      }
    }
  }
`;
