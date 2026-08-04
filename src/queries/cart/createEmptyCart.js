import { gql } from '@apollo/client';

export const CREATE_EMPTY_CART = gql`
  mutation createEmptyCart {
    createEmptyCart
  }
`;
