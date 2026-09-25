import { gql } from '@apollo/client';

// The admin's Contacts > Enable Contact Us switch (contact/contact/enabled).
// Only queryable once Magento_ContactGraphQl is installed — gate it behind
// GET_CONTACT_SUPPORT.
export const GET_CONTACT_ENABLED = gql`
  query getContactEnabled {
    storeConfig {
      contact_enabled
    }
  }
`;
