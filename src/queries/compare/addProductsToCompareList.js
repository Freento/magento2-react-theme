import { gql } from '@apollo/client';
import { COMPARE_LIST_FIELDS } from './compareListFields';

export const ADD_PRODUCTS_TO_COMPARE_LIST = gql`
  ${COMPARE_LIST_FIELDS}
  mutation addProductsToCompareList($uid: ID!, $products: [ID!]!) {
    addProductsToCompareList(input: { uid: $uid, products: $products }) {
      ...CompareListFields
    }
  }
`;
