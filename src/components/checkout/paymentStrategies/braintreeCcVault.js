export default {
  code: 'braintree_cc_vault',
  validate: (state) => (
    state.selectedVaultHash
      ? null
      : { payment: 'Please select one of your saved cards.' }
  ),
  prepare: async (state) => ({
    code: 'braintree_cc_vault',
    braintree_cc_vault: {
      public_hash: state.selectedVaultHash,
    },
  }),
};
