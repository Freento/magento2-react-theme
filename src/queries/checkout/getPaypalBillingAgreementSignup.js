import { gql } from '@apollo/client';

export const GET_PAYPAL_BILLING_AGREEMENT_SIGNUP = gql`
  query getPaypalBillingAgreementSignup {
    storeConfig {
      store_code
      paypal_express_billing_agreement_signup
    }
  }
`;
