import { useCallback } from 'react';
import { getPaymentStrategy } from '../paymentStrategies';

export default function usePaymentSubmit({
  state,
  actions,
  cartId,
  mutations,
  clearCart,
  navigate,
  strategyDeps = {},
}) {
  return useCallback(async () => {
    const { selectedPayment, completedSteps } = state;

    if (!selectedPayment) {
      actions.setErrors({ payment: 'Please select a payment method to continue.' });
      return;
    }
    if (completedSteps.has(3)) return;

    const strategy = getPaymentStrategy(selectedPayment);
    if (!strategy) {
      actions.setErrors({ payment: `Payment method ${selectedPayment} is not supported.` });
      return;
    }

    const fieldErrors = strategy.validate?.(state) || null;
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      actions.setErrors(fieldErrors);
      return;
    }

    actions.setPaymentLoading(true);
    actions.clearErrors();

    let paymentMethodInput;
    try {
      paymentMethodInput = await strategy.prepare(state, {
        createBraintreeClientToken: mutations.createBraintreeClientToken,
        ...strategyDeps,
      });
    } catch (err) {
      console.error(`[${selectedPayment}] prepare failed:`, err);
      actions.setErrors({ payment: err?.userMessage || err?.message || 'Payment preparation failed.' });
      actions.setPaymentLoading(false);
      return;
    }

    if (paymentMethodInput == null) {
      actions.setPaymentLoading(false);
      return;
    }

    try {
      const setRes = await mutations.setPaymentMethod({
        variables: { cartId, paymentMethod: paymentMethodInput },
        errorPolicy: 'all',
      });
      if (setRes?.errors?.length) {
        throw new Error(setRes.errors[0].message);
      }
      actions.completeStep(3);
    } catch (err) {
      console.error(`[${selectedPayment}] setPaymentMethodOnCart failed:`, err);
      actions.setErrors({ payment: err?.message || 'Could not set payment method.' });
      actions.setPaymentLoading(false);
      return;
    }

    // 3. placeOrder + redirect to success page.
    actions.setOrderLoading(true);
    try {
      const orderRes = await mutations.placeOrder({
        variables: { cartId },
        errorPolicy: 'all',
      });
      if (orderRes?.errors?.length) {
        throw new Error(orderRes.errors[0].message);
      }
      const orderNumber = orderRes?.data?.placeOrder?.order?.order_number;
      if (!orderNumber) {
        throw new Error('placeOrder returned no order number');
      }
      await clearCart();
      navigate('/checkout/success', { state: { orderNumber }, replace: true });
    } catch (err) {
      console.error(`[${selectedPayment}] placeOrder failed:`, err);
      actions.setErrors({ payment: err?.message || 'Order could not be placed.' });
    } finally {
      actions.setPaymentLoading(false);
      actions.setOrderLoading(false);
    }
  }, [state, actions, cartId, mutations, clearCart, navigate, strategyDeps]);
}
