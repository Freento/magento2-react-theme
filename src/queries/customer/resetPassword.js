import { gql } from '@apollo/client';

export const RESET_PASSWORD = gql`
  mutation resetPassword($email: String!, $resetPasswordToken: String!, $newPassword: String!) {
    resetPassword(
      email: $email
      resetPasswordToken: $resetPasswordToken
      newPassword: $newPassword
    )
  }
`;
