import { gql } from '@apollo/client';
import { COMPARE_LIST_FIELDS } from './compareListFields';

export const GET_COMPARE_LIST = gql`
  ${COMPARE_LIST_FIELDS}
  query getCompareList($uid: ID!) {
    compareList(uid: $uid) {
      ...CompareListFields
    }
  }
`;
