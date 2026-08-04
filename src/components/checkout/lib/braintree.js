import { useCallback } from 'react';
import { useMutation, gql } from '@apollo/client';

const BRAINTREE_CLIENT_SDK = 'https://js.braintreegateway.com/web/3.97.4/js/client.min.js';
const BRAINTREE_HOSTED_FIELDS_SDK = 'https://js.braintreegateway.com/web/3.97.4/js/hosted-fields.min.js';

let braintreeClientLoader = null;

export const loadBraintreeClient = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.braintree?.client) return Promise.resolve(window.braintree.client);
  if (braintreeClientLoader) return braintreeClientLoader;
  braintreeClientLoader = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = BRAINTREE_CLIENT_SDK;
    s.async = true;
    s.onload = () => {
      if (window.braintree?.client) resolve(window.braintree.client);
      else reject(new Error('braintree-web client SDK loaded but window.braintree.client is missing'));
    };
    s.onerror = () => {
      braintreeClientLoader = null; // allow retry on next attempt
      reject(new Error('Failed to load Braintree client SDK'));
    };
    document.head.appendChild(s);
  });
  return braintreeClientLoader;
};

let braintreeHostedFieldsLoader = null;
export const loadBraintreeHostedFields = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.braintree?.hostedFields) return Promise.resolve(window.braintree.hostedFields);
  if (braintreeHostedFieldsLoader) return braintreeHostedFieldsLoader;
  braintreeHostedFieldsLoader = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = BRAINTREE_HOSTED_FIELDS_SDK;
    s.async = true;
    s.onload = () => {
      if (window.braintree?.hostedFields) resolve(window.braintree.hostedFields);
      else reject(new Error('hosted-fields SDK loaded but window.braintree.hostedFields is missing'));
    };
    s.onerror = () => {
      braintreeHostedFieldsLoader = null;
      reject(new Error('Failed to load Braintree Hosted Fields SDK'));
    };
    document.head.appendChild(s);
  });
  return braintreeHostedFieldsLoader;
};

export const tokenizeBraintreeCard = async ({ cardData, clientToken }) => {
  if (!clientToken) throw new Error('Braintree client token missing');
  if (!cardData?.number) throw new Error('Card number missing');

  const braintreeClient = await loadBraintreeClient();
  const client = await braintreeClient.create({ authorization: clientToken });

  const mm = String(cardData.expiryMonth).padStart(2, '0');
  const yy = String(cardData.expiryYear).length === 2
    ? `20${cardData.expiryYear}`
    : String(cardData.expiryYear);

  const response = await client.request({
    endpoint: 'payment_methods/credit_cards',
    method: 'post',
    data: {
      creditCard: {
        number: String(cardData.number).replace(/\s+/g, ''),
        expirationDate: `${mm}/${yy}`,
        cvv: String(cardData.cvv || ''),
        cardholderName: cardData.holderName || '',
      },
    },
  });
  const nonce = response?.creditCards?.[0]?.nonce;
  if (!nonce) throw new Error('Braintree response missing nonce');
  return nonce;
};

export const CREATE_BRAINTREE_CLIENT_TOKEN = gql`
  mutation createBraintreeClientToken {
    createBraintreeClientToken
  }
`;

export const useBraintreeClientToken = () => {
  const [mutate] = useMutation(CREATE_BRAINTREE_CLIENT_TOKEN);
  return useCallback(async () => {
    const res = await mutate();
    const token = res?.data?.createBraintreeClientToken;
    if (!token) throw new Error('Braintree client token unavailable');
    return token;
  }, [mutate]);
};
