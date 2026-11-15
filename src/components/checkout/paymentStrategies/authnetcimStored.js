export default {
  code: 'authnetcim_stored',
  validate: (state) => (
    state.selectedVaultHash
      ? null
      : { payment: 'Please select one of your saved cards.' }
  ),
  prepare: async (state) => ({
    code: 'authnetcim',
    tokenbase_data: {
      card_id: state.selectedVaultHash,
    },
  }),
};
