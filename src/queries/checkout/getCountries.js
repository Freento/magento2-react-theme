import { gql } from '@apollo/client';

export const GET_COUNTRIES = gql`
  query getCountries {
    countries {
      id
      two_letter_abbreviation
      three_letter_abbreviation
      full_name_locale
      available_regions {
        id
        code
        name
      }
    }
  }
`;
