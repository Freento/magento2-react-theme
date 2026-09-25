import { gql } from '@apollo/client';

// Magento_ContactGraphQl ships from 2.4.7 on; on 2.4.6 the whole `contactUs`
// branch of the schema is simply absent. Probing by type is the only form that
// degrades: an unknown type resolves to `null` (alongside an entry in `errors`,
// hence errorPolicy: 'all' at the call site), whereas naming a missing *field* —
// `storeConfig { contact_enabled }` — is a validation error that fails the whole
// document. That is also why `contact_enabled` cannot share a query with this.
export const GET_CONTACT_SUPPORT = gql`
  query getContactSupport {
    __type(name: "ContactUsInput") {
      name
    }
  }
`;
