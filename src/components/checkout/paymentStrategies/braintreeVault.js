const vaultStrategy = (code) => ({
  code,
  validate: (state) => (
    state.selectedVaultHash
      ? null
      : { payment: 'Please select one of your saved payment methods.' }
  ),
  prepare: async (state) => ({
    code,
    [code]: {
      public_hash: state.selectedVaultHash,
    },
  }),
});

export const braintreeCcVault = vaultStrategy('braintree_cc_vault');
export const braintreeGooglePayVault = vaultStrategy('braintree_googlepay_vault');
export const braintreePayPalVault = vaultStrategy('braintree_paypal_vault');
