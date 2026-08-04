import { gql } from '@apollo/client';

export const SUBSCRIBE_TO_NEWSLETTER = gql`
  mutation subscribeEmailToNewsletter($email: String!) {
    subscribeEmailToNewsletter(email: $email) {
      status
    }
  }
`;
