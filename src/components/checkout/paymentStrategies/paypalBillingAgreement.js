export default {
  code: 'paypal_billing_agreement',
  validate: (state) => (
    state.selectedVaultHash
      ? null
      : { payment: 'Please select one of your PayPal billing agreements.' }
  ),
  prepare: async (state) => ({
    code: 'paypal_billing_agreement',
    paypal_billing_agreement: {
      agreement_id: Number(state.selectedVaultHash),
    },
  }),
};
