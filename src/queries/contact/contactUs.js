import { gql } from '@apollo/client';

export const CONTACT_US = gql`
  mutation contactUs($name: String!, $email: String!, $telephone: String, $comment: String!) {
    contactUs(input: { name: $name, email: $email, telephone: $telephone, comment: $comment }) {
      status
    }
  }
`;
