import React, { useEffect, useRef, useState } from 'react';
import { loadBraintreeClient, loadBraintreePayPalCheckout, useBraintreeClientToken } from '../lib/braintree';
import SaveForLaterCheckbox from '../SaveForLaterCheckbox';

const toPayPalAddress = (a) => {
  if (!a?.street?.[0] || !a.country?.code) return undefined;
  return {
    recipientName: `${a.firstname || ''} ${a.lastname || ''}`.trim() || undefined,
    line1: a.street[0],
    line2: a.street[1] || undefined,
    city: a.city,
    countryCode: a.country.code,
    postalCode: a.postcode,
    state: a.region?.code || undefined,
  };
};

const ADDRESS_ERROR = 'Address failed validation. Please check and confirm your City, State, and Postal Code.';
const isAddressError = (err) =>
  err?.errorName === 'VALIDATION_ERROR' || /Value is invalid|payment options are invalid/i.test(err?.errorMessage || err?.message || '');

export default function BraintreePayPalButton({
  setPaymentAndPlaceOrder,
  totalAmount = 0,
  currencyCode = 'USD',
  shippingAddress = null,
  environment = null,
  merchantCountry = null,
  buttonStyle = {},
  disabled = false,
  showSaveForLater = false,
}) {
  const createClientToken = useBraintreeClientToken();
  const [phase, setPhase] = useState('init');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saveForLater, setSaveForLater] = useState(false);
  const hostRef = useRef(null);
  const saveRef = useRef(false);
  const orderRef = useRef({ totalAmount, currencyCode, shippingAddress });
  const placeRef = useRef(setPaymentAndPlaceOrder);
  const styleRef = useRef(buttonStyle);
  saveRef.current = showSaveForLater && saveForLater;
  orderRef.current = { totalAmount, currencyCode, shippingAddress };
  placeRef.current = setPaymentAndPlaceOrder;
  styleRef.current = buttonStyle;

  useEffect(() => {
    let cancelled = false;
    let buttons = null;
    let instance = null;

    (async () => {
      try {
        const [braintreeClient, braintreePayPalCheckout, clientToken] = await Promise.all([
          loadBraintreeClient(),
          loadBraintreePayPalCheckout(),
          createClientToken(),
        ]);
        if (cancelled) return;
        const client = await braintreeClient.create({ authorization: clientToken });
        if (cancelled) return;
        instance = await braintreePayPalCheckout.create({ client });
        await instance.loadPayPalSDK({
          currency: currencyCode,
          intent: 'capture',
          components: 'buttons',
          ...(environment === 'sandbox' && merchantCountry ? { 'buyer-country': merchantCountry } : {}),
        });
        if (cancelled || !hostRef.current) return;

        const style = styleRef.current || {};
        buttons = window.paypal.Buttons({
          fundingSource: window.paypal.FUNDING.PAYPAL,
          style: {
            label: style.label || 'paypal',
            color: style.color || 'gold',
            shape: style.shape || 'rect',
            height: 44,
          },
          createOrder: () => {
            setError('');
            const { totalAmount: amount, currencyCode: currency, shippingAddress: address } = orderRef.current;
            return instance.createPayment({
              flow: 'checkout',
              intent: 'capture',
              amount: Number(amount || 0).toFixed(2),
              currency,
              enableShippingAddress: true,
              shippingAddressEditable: false,
              shippingAddressOverride: toPayPalAddress(address),
              requestBillingAgreement: !!saveRef.current,
            }).catch((err) => {
              throw err?.details?.originalError?.details?.originalError?.paymentResource || err;
            });
          },
          onApprove: async (data) => {
            setBusy(true);
            try {
              const payload = await instance.tokenizePayment(data);
              await placeRef.current(payload.nonce, !!saveRef.current);
            } catch (err) {
              console.error('[braintree-paypal] payment failed:', err);
              setError(err?.message || 'PayPal payment failed. Please try again.');
              setBusy(false);
            }
          },
          onCancel: () => setBusy(false),
          onError: (err) => {
            console.error('[braintree-paypal] button error:', err);
            setError(isAddressError(err) ? ADDRESS_ERROR : 'PayPal did not complete. Please try again.');
            setBusy(false);
          },
        });
        await buttons.render(hostRef.current);
        if (!cancelled) setPhase('ready');
      } catch (err) {
        if (cancelled) return;
        console.error('[braintree-paypal] init failed:', err);
        setError(err?.message || 'PayPal is unavailable right now.');
        setPhase('error');
      }
    })();

    return () => {
      cancelled = true;
      try { buttons?.close(); } catch {}
      try { instance?.teardown(); } catch {}
    };
  }, [createClientToken, currencyCode, environment, merchantCountry]);

  return (
    <div className={`paypal-wrap relative w-full mt-4${busy ? ' pointer-events-none' : ''}${disabled ? ' pointer-events-none opacity-50' : ''}`} aria-busy={busy}>
      {showSaveForLater && (
        <SaveForLaterCheckbox
          className="mb-3"
          checked={saveForLater}
          onChange={setSaveForLater}
          disabled={busy || disabled}
        />
      )}
      <div className="paypal-button-slot relative min-h-[44px] w-full">
        {phase === 'init' && <span className="skeleton absolute inset-0 z-[1] rounded" aria-hidden="true" />}
        <div ref={hostRef} className="paypal-button-host w-full" />
      </div>
      {busy && (
        <span className="paypal-button-overlay absolute inset-0 flex items-center justify-center rounded bg-black/35" aria-hidden="true">
          <span className="w-[18px] h-[18px] rounded-full border-2 border-white/50 border-t-white animate-spin" />
        </span>
      )}
      {error && <p className="paypal-error mt-2 mb-0 text-13 text-sale" role="alert">{error}</p>}
    </div>
  );
}
