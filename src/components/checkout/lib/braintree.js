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

const BRAINTREE_PAYPAL_CHECKOUT_SDK = 'https://js.braintreegateway.com/web/3.97.4/js/paypal-checkout.min.js';

let braintreePayPalCheckoutLoader = null;
export const loadBraintreePayPalCheckout = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.braintree?.paypalCheckout) return Promise.resolve(window.braintree.paypalCheckout);
  if (braintreePayPalCheckoutLoader) return braintreePayPalCheckoutLoader;
  braintreePayPalCheckoutLoader = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = BRAINTREE_PAYPAL_CHECKOUT_SDK;
    s.async = true;
    s.onload = () => {
      if (window.braintree?.paypalCheckout) resolve(window.braintree.paypalCheckout);
      else reject(new Error('paypal-checkout SDK loaded but window.braintree.paypalCheckout is missing'));
    };
    s.onerror = () => {
      braintreePayPalCheckoutLoader = null;
      reject(new Error('Failed to load Braintree PayPal Checkout SDK'));
    };
    document.head.appendChild(s);
  });
  return braintreePayPalCheckoutLoader;
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
