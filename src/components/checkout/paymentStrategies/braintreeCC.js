const userError = (msg) => {
  const err = new Error(msg);
  err.userMessage = msg;
  return err;
};

export default {
  code: 'braintree',
  validate: null,
  prepare: async (state, deps) => {
    if (typeof deps.braintreeHostedTokenize !== 'function') {
      throw userError('Card form is still loading. Please wait a moment and try again.');
    }
    let nonce;
    try {
      nonce = await deps.braintreeHostedTokenize();
    } catch (err) {
      console.error('[braintree-cc] hosted-fields tokenize failed:', err);
      const invalid = err?.details?.invalidFieldKeys || [];
      if (invalid.length > 0) {
        const labels = invalid.map((k) => ({
          number: 'card number',
          cvv: 'CVV',
          expirationDate: 'expiration date',
          cardholderName: 'cardholder name',
        }[k] || k)).join(', ');
        throw userError(`Please check the following: ${labels}.`);
      }
      throw userError(err?.message || 'Card was rejected.');
    }
    if (!nonce) throw userError('No payment token returned from card form.');

    return {
      code: 'braintree',
      braintree: {
        payment_method_nonce: nonce,
        device_data: '',
        is_active_payment_token_enabler: !!state.saveCard,
      },
    };
  },
};
