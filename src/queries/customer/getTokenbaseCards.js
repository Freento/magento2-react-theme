import { gql } from '@apollo/client';

export const GET_TOKENBASE_CARDS = gql`
  query getTokenbaseCards {
    tokenBaseCards {
      hash
      label
      method
      active
      expires
      additional {
        cc_type
        cc_last4
        cc_exp_month
        cc_exp_year
      }
    }
  }
`;
