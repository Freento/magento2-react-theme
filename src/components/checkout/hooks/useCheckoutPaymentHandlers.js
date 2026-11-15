import { useCallback } from 'react';
import { isCartAuthError } from '../checkoutHelpers';

export default function useCheckoutPaymentHandlers({
  state,
  actions,
  mutations,
  cartId,
  user,
  clearCart,
  navigate,
}) {
  const handlePaymentMethodSelect = useCallback((paymentCode) => {
    if (state.selectedPayment !== paymentCode) {
      const next = new Set(state.completedSteps);
      next.delete(3);
      // Replay completed steps via reducer (we only have full-set reset).
      actions.resetCompletedSteps();
      next.forEach((s) => actions.completeStep(s));
    }
    actions.setSelectedPayment(paymentCode);
    if (state.errors.payment) {
      actions.setErrors({ ...state.errors, payment: '' });
    }
  }, [state, actions]);

  const handlePayPalSuccess = () => {};
  const handlePayPalError = () =>
    actions.setErrors({ payment: 'PayPal payment failed. Please try again or select a different payment method.' });
  const handlePayPalCancel = () =>
    actions.setErrors({ payment: 'PayPal payment was cancelled. Please try again or select a different payment method.' });

  const handleAuthorizeNetTransactionComplete = useCallback(async (result) => {
    try {
      actions.setPaymentLoading(true);
      let paymentMethodInput = { code: 'authnetcim' };
      if (result.transactionId) {
        paymentMethodInput = {
          code: 'authnetcim',
          tokenbase_data: { transaction_id: result.transactionId, save: !!result.saveCard },
        };
      }

      if (result.iframeSessionId) {
        try {
          await mutations.syncHostedForm({
            variables: {
              cartId,
              iframeSessionId: result.iframeSessionId,
              guestEmail: user?.email || state.email || null,
            },
          });
        } catch (syncError) {
          if (isCartAuthError(syncError)) {
            navigate('/', { replace: true });
            return;
          }
          // Fall through with bare code — backend can still resolve from session.
        }
      }

      await mutations.setPaymentMethod({ variables: { cartId, paymentMethod: paymentMethodInput } });
      actions.completeStep(3);
      actions.setOrderLoading(true);

      const orderResult = await mutations.placeOrder({ variables: { cartId } });
      const orderNumber = orderResult.data?.placeOrder?.order?.order_number;
      if (!orderNumber) throw new Error('placeOrder returned no order number');
      await clearCart();
      navigate('/checkout/success', { state: { orderNumber }, replace: true });
    } catch (error) {
      console.error('[authnetcim] iframe-complete flow failed:', error);
      if (isCartAuthError(error)) {
        navigate('/', { replace: true });
        return;
      }
      actions.setErrors({ payment: 'Transaction completed but failed to process in checkout. Please contact support.' });
    } finally {
      actions.setPaymentLoading(false);
      actions.setOrderLoading(false);
    }
  }, [actions, cartId, clearCart, mutations, navigate, state.email, user]);

  const handleAuthorizeNetTransactionError = (error) => {
    actions.setErrors({ payment: error.error || 'Payment failed. Please try again.' });
    actions.setPaymentLoading(false);
  };

  const walletPlaceOrder = useCallback(async ({ code, inputKey, label, nonce, saveForLater }) => {
    if (!nonce) throw new Error(`${label} returned no nonce`);
    const setRes = await mutations.setPaymentMethod({
      variables: {
        cartId,
        paymentMethod: {
          code,
          [inputKey]: {
            payment_method_nonce: nonce,
            is_active_payment_token_enabler: !!saveForLater,
          },
        },
      },
      errorPolicy: 'all',
    });
    if (setRes?.errors?.length) throw new Error(setRes.errors[0].message);

    const orderRes = await mutations.placeOrder({ variables: { cartId }, errorPolicy: 'all' });
    if (orderRes?.errors?.length) throw new Error(orderRes.errors[0].message);
    const orderNumber = orderRes?.data?.placeOrder?.order?.order_number;
    if (!orderNumber) throw new Error('placeOrder returned no order number');
    await clearCart();
    navigate('/checkout/success', { state: { orderNumber }, replace: true });
  }, [cartId, mutations, clearCart, navigate]);

  const googlePayPlaceOrder = useCallback(
    (nonce, saveForLater) => walletPlaceOrder({
      code: 'braintree_googlepay', inputKey: 'braintree', label: 'Google Pay', nonce, saveForLater,
    }),
    [walletPlaceOrder],
  );

  const paypalPlaceOrder = useCallback(
    (nonce, saveForLater) => walletPlaceOrder({
      code: 'braintree_paypal', inputKey: 'braintree_paypal', label: 'PayPal', nonce, saveForLater,
    }),
    [walletPlaceOrder],
  );

  const dismissErrorKey = useCallback((key) => {
    const next = { ...state.errors };
    delete next[key];
    actions.setErrors(next);
  }, [state.errors, actions]);

  return {
    handlePaymentMethodSelect,
    handlePayPalSuccess,
    handlePayPalError,
    handlePayPalCancel,
    handleAuthorizeNetTransactionComplete,
    handleAuthorizeNetTransactionError,
    googlePayPlaceOrder,
    paypalPlaceOrder,
    dismissErrorKey,
  };
}
