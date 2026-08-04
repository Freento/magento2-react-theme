const userError = (msg) => {
  const err = new Error(msg);
  err.userMessage = msg;
  return err;
};

export default {
  code: 'braintree_cc_vault',
  validate: () => ({
    payment: 'Saved card payment is not available. Please select "Check / Money order" or enter new card details with "Credit Card" option.',
  }),
  prepare: () => {
    throw userError('Saved card payment not implemented yet.');
  },
};
