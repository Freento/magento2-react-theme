import { gql } from '@apollo/client';

export const CANCEL_PAYPAL_BILLING_AGREEMENT = gql`
  mutation cancelPaypalBillingAgreement($id: Int!) {
    cancelPaypalBillingAgreement(id: $id)
  }
`;
