import { gql } from '@apollo/client';

export const GET_TOKENBASE_CHECKOUT_CONFIG = gql`
  query getTokenbaseCheckoutConfig($method: String!) {
    tokenBaseCheckoutConfig(method: $method) {
      method
      useVault
      canSaveCard
      forceSaveCard
      defaultSaveCard
      isCcDetectionEnabled
      logoImage
      requireCcv
      sandbox
      canStoreBin
      availableTypes {
        key
        value
      }
      months {
        key
        value
      }
      years {
        key
        value
      }
      hasVerification
      cvvImageUrl
      apiLoginId
      clientKey
    }
  }
`;
