import { gql } from '@apollo/client';

export const REQUEST_PASSWORD_RESET = gql`
  mutation requestPasswordResetEmail($email: String!) {
    requestPasswordResetEmail(email: $email)
  }
`;
