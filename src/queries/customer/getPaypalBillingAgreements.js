import { gql } from '@apollo/client';

export const GET_PAYPAL_BILLING_AGREEMENTS = gql`
  query getPaypalBillingAgreements {
    customerPaypalBillingAgreements {
      id
      reference_id
      label
      status
      created_at
    }
  }
`;
