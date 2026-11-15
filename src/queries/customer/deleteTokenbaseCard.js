import { gql } from '@apollo/client';

export const DELETE_TOKENBASE_CARD = gql`
  mutation deleteTokenbaseCard($hash: String!) {
    deleteTokenBaseCard(hash: $hash)
  }
`;
