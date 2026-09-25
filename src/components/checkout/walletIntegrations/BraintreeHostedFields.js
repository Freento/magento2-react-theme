import React, { useEffect, useRef, useState } from 'react';
import { loadBraintreeClient, loadBraintreeHostedFields, useBraintreeClientToken } from '../lib/braintree';
import { CARD_FORM_CONTAINER_CLS, CARD_FORM_TITLE_CLS } from '../checkoutUi';

const readVar = (name, fallback) => {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

const buildHostedFieldStyles = () => ({
  input: {
    'font-family': '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'font-size':   '14px',
    color:         readVar('--ink', '#111111'),
    'letter-spacing': '0',
  },
  ':focus':   { color: readVar('--ink', '#111111') },
  '.invalid': { color: '#B91C1C' },
  '.valid':   { color: readVar('--ink', '#111111') },
});

export default function BraintreeHostedFields({ onReady, onError }) {
  const createClientToken = useBraintreeClientToken();
  const [phase, setPhase] = useState('init');
  const [error, setError] = useState('');
  const instanceRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let createdInstance = null;

    (async () => {
      try {
        const [braintreeClient, braintreeHostedFields, clientToken] = await Promise.all([
          loadBraintreeClient(),
          loadBraintreeHostedFields(),
          createClientToken(),
        ]);
        if (cancelled) return;

        const client = await braintreeClient.create({ authorization: clientToken });
        if (cancelled) return;

        const hostedFields = await braintreeHostedFields.create({
          client,
          styles: buildHostedFieldStyles(),
          fields: {
            number: {
              container: '#braintree-hosted-card-number',
              placeholder: '1234 5678 9012 3456',
            },
            cardholderName: {
              container: '#braintree-hosted-cardholder',
              placeholder: 'John Doe',
            },
            expirationDate: {
              container: '#braintree-hosted-expiration',
              placeholder: 'MM/YY',
            },
            cvv: {
              container: '#braintree-hosted-cvv',
              placeholder: '123',
            },
          },
        });
        if (cancelled) {
          // Race: parent already unmounted. Tear down immediately so the
          // iframe doesn't linger as a detached DOM node.
          try { hostedFields.teardown(); } catch {}
          return;
        }

        createdInstance = hostedFields;
        instanceRef.current = hostedFields;
        setPhase('ready');

        if (onReady) {
          onReady(async () => {
            const { nonce } = await hostedFields.tokenize();
            return nonce;
          });
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[hosted-fields] init failed:', err);
        const msg = err?.message || 'Could not initialise card form.';
        setError(msg);
        setPhase('error');
        if (onError) onError(msg);
      }
    })();

    return () => {
      cancelled = true;
      if (onReady) onReady(null);
      if (createdInstance) {
        try { createdInstance.teardown(); } catch {}
      }
      instanceRef.current = null;
    };
  }, []);

  const hostedFieldCls = 'form-input hosted-field h-11 px-3 py-0 flex items-center';

  return (
    <div className={CARD_FORM_CONTAINER_CLS}>
      <h4 className={CARD_FORM_TITLE_CLS}>Credit Card Information</h4>

      {phase === 'error' && (
        <div className="form-error" role="alert">{error || 'Card form could not be loaded.'}</div>
      )}

      <div className="card-form-grid grid gap-3.5" aria-busy={phase === 'init'}>
        <div className="form-group">
          <label className="form-label" htmlFor="braintree-hosted-card-number">Card Number *</label>
          <div className="relative">
            <div id="braintree-hosted-card-number" className={hostedFieldCls} />
            {phase === 'init' && <span className="skeleton absolute inset-0 rounded" />}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="braintree-hosted-cardholder">Cardholder Name *</label>
          <div className="relative">
            <div id="braintree-hosted-cardholder" className={hostedFieldCls} />
            {phase === 'init' && <span className="skeleton absolute inset-0 rounded" />}
          </div>
        </div>

        <div className="form-row-3">
          <div className="form-group col-span-2">
            <label className="form-label" htmlFor="braintree-hosted-expiration">Expiry Date *</label>
            <div className="relative">
              <div id="braintree-hosted-expiration" className={hostedFieldCls} />
              {phase === 'init' && <span className="skeleton absolute inset-0 rounded" />}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="braintree-hosted-cvv">CVV *</label>
            <div className="relative">
              <div id="braintree-hosted-cvv" className={hostedFieldCls} />
              {phase === 'init' && <span className="skeleton absolute inset-0 rounded" />}
            </div>
          </div>
        </div>
      </div>

      <div className="card-security-note mt-4 px-3 py-2.5 bg-surface rounded text-sm text-ink-2 leading-base">
        <p>🔒 Card data is captured by Braintree's secure iframe — never touches this page.</p>
      </div>
    </div>
  );
}
