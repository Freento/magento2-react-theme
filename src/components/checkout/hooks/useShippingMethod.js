import { useCallback } from 'react';

export default function useShippingMethod({
  state,
  actions,
  cartId,
  mutations,
  navigate,
  isCartAuthError,
}) {
  const selectShippingMethod = useCallback((carrierCode, methodCode) => {
    const shippingKey = `${carrierCode}_${methodCode}`;
    const previous = state.selectedShipping;
    actions.setSelectedShipping(shippingKey);

    if (previous !== shippingKey && state.completedSteps.size > 0) {
      actions.resetCompletedSteps();
      if (state.completedSteps.has(1)) actions.completeStep(1);
    }

    if (state.errors.shipping) {
      actions.setErrors({ ...state.errors, shipping: '' });
    }
  }, [state, actions]);

  const submitShippingMethod = useCallback(async () => {
    if (!state.selectedShipping) {
      actions.setErrors({ shipping: 'Please select a shipping method to continue.' });
      return;
    }

    if (state.completedSteps.has(2)) {
      actions.setStep(3);
      return;
    }

    const [carrierCode, methodCode] = state.selectedShipping.split('_');
    actions.setShippingLoading(true);
    try {
      await mutations.setShippingMethod({
        variables: { cartId, carrierCode, methodCode },
      });
      actions.completeStep(2);
      actions.setStep(3);
    } catch (error) {
      console.error('Error setting shipping method:', error);
      if (isCartAuthError(error)) {
        navigate('/', { replace: true });
        return;
      }
      const errorMessage = error?.graphQLErrors?.[0]?.message || error?.message || '';
      if (errorMessage.includes('getStreetFull') || errorMessage.includes('Internal server error')) {
        actions.setErrors({
          shipping: 'There was an issue with your shipping address. Please go back to step 1 and re-enter your address.',
        });
        actions.setStep(1);
      } else if (/carrier with such method not found/i.test(errorMessage)) {
        actions.setErrors({
          shipping: 'This shipping option is no longer available for your address. Pick a different method.',
        });
      } else {
        actions.setErrors({
          shipping: errorMessage || 'Failed to select shipping method. Please try again.',
        });
      }
    } finally {
      actions.setShippingLoading(false);
    }
  }, [state, actions, cartId, mutations, navigate, isCartAuthError]);

  return { selectShippingMethod, submitShippingMethod };
}
