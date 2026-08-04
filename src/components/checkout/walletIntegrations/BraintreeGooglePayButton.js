import React, { useCallback, useEffect, useRef, useState } from 'react';
import { loadBraintreeClient, useBraintreeClientToken } from '../lib/braintree';
import '../../../styles/checkout/walletIntegrations/BraintreeGooglePayButton.less';

const GOOGLE_PAY_API_SDK = 'https://pay.google.com/gp/p/js/pay.js';
const BRAINTREE_GOOGLE_PAY_SDK = 'https://js.braintreegateway.com/web/3.97.4/js/google-payment.min.js';

let googlePayApiLoader = null;
const loadGooglePayApi = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.google?.payments?.api?.PaymentsClient) return Promise.resolve();
  if (googlePayApiLoader) return googlePayApiLoader;
  googlePayApiLoader = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = GOOGLE_PAY_API_SDK;
    s.async = true;
    s.onload = () => {
      if (window.google?.payments?.api?.PaymentsClient) resolve();
      else reject(new Error('Google Pay API loaded but PaymentsClient missing'));
    };
    s.onerror = () => {
      googlePayApiLoader = null;
      reject(new Error('Failed to load Google Pay JS API'));
    };
    document.head.appendChild(s);
  });
  return googlePayApiLoader;
};

let braintreeGooglePaySdkLoader = null;
const loadBraintreeGooglePaySdk = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.braintree?.googlePayment) return Promise.resolve(window.braintree.googlePayment);
  if (braintreeGooglePaySdkLoader) return braintreeGooglePaySdkLoader;
  braintreeGooglePaySdkLoader = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = BRAINTREE_GOOGLE_PAY_SDK;
    s.async = true;
    s.onload = () => {
      if (window.braintree?.googlePayment) resolve(window.braintree.googlePayment);
      else reject(new Error('google-payment SDK loaded but window.braintree.googlePayment missing'));
    };
    s.onerror = () => {
      braintreeGooglePaySdkLoader = null;
      reject(new Error('Failed to load Braintree Google Pay SDK'));
    };
    document.head.appendChild(s);
  });
  return braintreeGooglePaySdkLoader;
};

export default function BraintreeGooglePayButton({
  setPaymentAndPlaceOrder,
  googleMerchantId,
  environment = 'TEST',
  countryCode = 'US',
  currencyCode = 'USD',
  totalAmount,
  disabled = false,
}) {
  const createClientToken = useBraintreeClientToken();

  const [phase, setPhase] = useState('init');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const paymentsClientRef = useRef(null);
  const googlePayInstanceRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [_, braintreeGooglePay, clientToken, braintreeClient] = await Promise.all([
          loadGooglePayApi(),
          loadBraintreeGooglePaySdk(),
          createClientToken(),
          loadBraintreeClient(),
        ]);
        if (cancelled) return;
        const client = await braintreeClient.create({ authorization: clientToken });
        if (cancelled) return;
        const googlePayInstance = await braintreeGooglePay.create({
          client,
          googlePayVersion: 2,
          ...(googleMerchantId ? { googleMerchantId } : {}),
        });
        if (cancelled) return;
        googlePayInstanceRef.current = googlePayInstance;
        const paymentsClient = new window.google.payments.api.PaymentsClient({ environment });
        paymentsClientRef.current = paymentsClient;
        const isReadyResult = await paymentsClient.isReadyToPay({
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: googlePayInstance.createPaymentDataRequest().allowedPaymentMethods,
        });
        if (cancelled) return;
        setPhase(isReadyResult?.result ? 'ready' : 'unsupported');
      } catch (err) {
        console.error('[google-pay] init failed:', err);
        if (!cancelled) {
          setError(err?.message || 'Google Pay initialisation failed');
          setPhase('unsupported');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [loadBraintreeClient, createClientToken, environment, googleMerchantId]);

  const handleClick = useCallback(async () => {
    if (busy || disabled) return;
    const googlePayInstance = googlePayInstanceRef.current;
    const paymentsClient = paymentsClientRef.current;
    if (!googlePayInstance || !paymentsClient) return;
    setError('');
    setBusy(true);
    try {
      const paymentDataRequest = googlePayInstance.createPaymentDataRequest({
        transactionInfo: {
          currencyCode,
          totalPriceStatus: 'FINAL',
          totalPrice: String(totalAmount ?? '0'),
          countryCode,
        },
      });
      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);
      const result = await googlePayInstance.parseResponse(paymentData);
      const nonce = result?.nonce;
      if (!nonce) throw new Error('Google Pay returned no nonce');
      await setPaymentAndPlaceOrder(nonce);
    } catch (err) {
      if (err?.statusCode === 'CANCELED') {
        setBusy(false);
        return;
      }
      console.error('[google-pay] payment failed:', err);
      setError(err?.message || 'Google Pay payment failed');
    } finally {
      setBusy(false);
    }
  }, [busy, disabled, currencyCode, countryCode, totalAmount, setPaymentAndPlaceOrder]);

  if (phase === 'init') {
    return (
      <div className="gpay-wrap" aria-busy="true" aria-live="polite">
        <div className="gpay-skeleton" aria-hidden="true" />
      </div>
    );
  }

  if (phase === 'unsupported') {
    return error ? (
      <p className="gpay-error" role="alert">{error}</p>
    ) : (
      <p className="gpay-unsupported">
        Google Pay isn't available in this browser. Use Chrome on Android, or pick another payment method.
      </p>
    );
  }

  return (
    <div className="gpay-wrap">
      <button
        type="button"
        className={`gpay-button${busy ? ' is-busy' : ''}`}
        onClick={handleClick}
        disabled={busy || disabled}
        aria-label="Pay with Google Pay"
      >
        <span aria-hidden="true" className="gpay-button-label">
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#4285F4" d="M44.5 20H24v8.5h11.7c-1.1 5.3-5.6 8.7-11.7 8.7-7 0-12.6-5.7-12.6-12.7S17 11.8 24 11.8c3.2 0 6.1 1.2 8.3 3.1l6.1-6.1C34.7 5.4 29.7 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c11.5 0 20.7-8.4 20.7-21 0-1.4-.2-2.7-.2-4z"/>
          </svg>
          <span>{busy ? 'Processing…' : 'Pay'}</span>
        </span>
      </button>
      {error && <p className="gpay-error" role="alert">{error}</p>}
    </div>
  );
}
