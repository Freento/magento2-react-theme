import { gql } from '@apollo/client';
import { COMPARE_LIST_FIELDS } from './compareListFields';

export const CREATE_COMPARE_LIST = gql`
  ${COMPARE_LIST_FIELDS}
  mutation createCompareList($products: [ID!]) {
    createCompareList(input: { products: $products }) {
      ...CompareListFields
    }
  }
`;
