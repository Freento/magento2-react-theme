import { gql } from '@apollo/client';
import { COMPARE_LIST_FIELDS } from './compareListFields';

export const REMOVE_PRODUCTS_FROM_COMPARE_LIST = gql`
  ${COMPARE_LIST_FIELDS}
  mutation removeProductsFromCompareList($uid: ID!, $products: [ID!]!) {
    removeProductsFromCompareList(input: { uid: $uid, products: $products }) {
      ...CompareListFields
    }
  }
`;
