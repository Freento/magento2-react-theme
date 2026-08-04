import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import '../../styles/checkout/Checkout.less';

import CheckoutSteps from './CheckoutSteps';
import ShippingAddressForm from './ShippingAddressForm';
import ShippingMethodsForm from './ShippingMethodsForm';
import PaymentMethodsForm from './PaymentMethodsForm';
import CheckoutSummary from './CheckoutSummary';
import CheckoutCoupon from './CheckoutCoupon';
import CheckoutGiftCard from './CheckoutGiftCard';

import useCheckoutState from './hooks/useCheckoutState';
import useCheckoutQueries from './hooks/useCheckoutQueries';
import useAddressManagement from './hooks/useAddressManagement';
import useShippingMethod from './hooks/useShippingMethod';
import usePaymentSubmit from './hooks/usePaymentSubmit';
import useCheckoutPaymentHandlers from './hooks/useCheckoutPaymentHandlers';
import { isCartAuthError, getInitialStep } from './checkoutHelpers';
import { loadBraintreeClient } from './lib/braintree';

const Checkout = () => {
  const { cartData, cartId, loading: cartLoading, merging: cartMerging, clearCart, loadCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Cart fetch is deferred globally until user-intent (mini-cart open,
  // add-to-cart, or here — landing on /checkout). Without this, the
  // checkout page would render with empty cart data and bounce.
  useEffect(() => { loadCart(); }, [loadCart]);

  const { state, actions } = useCheckoutState(getInitialStep(location.hash));

  // ──────────────────────────────────────── Queries + mutations
  const checkoutQueries = useCheckoutQueries({
    cartId,
    currentStep: state.currentStep,
    user,
  });
  const { mutations, data, loading, refetch } = checkoutQueries;
  const { paymentMethods, shippingMethods, customer } = checkoutQueries.queries;

  useEffect(() => {
    if (state.currentStep > 0) {
      navigate(`#${state.currentStep}`, { replace: true });
    }
  }, [state.currentStep, navigate]);

  useEffect(() => {
    const handleHashChange = () => {
      const newStep = getInitialStep(window.location.hash);
      if (newStep !== state.currentStep) actions.setStep(newStep);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [state.currentStep, actions]);

  useEffect(() => {
    if (state.addressDataLoaded || !user || !customer.data?.customer) return;
    const c = customer.data.customer;
    const addresses = c.addresses || [];
    const def = addresses.find((a) => a.default_shipping) || addresses[0];

    let shippingAddress = null;
    if (def) {
      shippingAddress = {
        firstname: def.firstname || c.firstname || '',
        lastname: def.lastname || c.lastname || '',
        street: def.street || [''],
        city: def.city || '',
        region: def.region?.region || '',
        region_id: def.region?.region_id || '',
        postcode: def.postcode || '',
        country_code: def.country_code || 'US',
        telephone: def.telephone || '',
      };
    } else {
      shippingAddress = {
        ...state.shippingAddress,
        firstname: c.firstname || state.shippingAddress.firstname,
        lastname: c.lastname || state.shippingAddress.lastname,
      };
    }

    actions.hydrateFromCustomer({
      email: c.email || '',
      selectedAddressId: def?.id ?? null,
      shippingAddress,
      showAddressSelector: addresses.length >= 1,
    });
  }, [user, customer.data, state.addressDataLoaded, state.shippingAddress, actions]);

  useEffect(() => {
    if (state.currentStep !== 2 || !shippingMethods.data) return;
    const addr = shippingMethods.data?.cart?.shipping_addresses?.[0];
    if (!addr || !addr.street?.length) {
      actions.setErrors({ general: 'Shipping address is missing. Please re-enter your shipping address.' });
      actions.setStep(1);
    }
  }, [state.currentStep, shippingMethods.data, actions]);

  const countries = data.countries;
  const selectedCountryRegions = useMemo(
    () =>
      countries.find((c) => c.two_letter_abbreviation === state.shippingAddress.country_code)
        ?.available_regions || [],
    [countries, state.shippingAddress.country_code],
  );

  const optionalZipCountries = [];

  // ──────────────────────────────────────── Sub-flow hooks
  const addressMgr = useAddressManagement({
    state,
    actions,
    cartId,
    user,
    customerAddresses: data.customerAddresses,
    mutations,
    navigate,
    isCartAuthError,
  });

  const shippingMgr = useShippingMethod({
    state,
    actions,
    cartId,
    mutations,
    navigate,
    isCartAuthError,
  });

  const braintreeTokenizeRef = useRef(null);
  const onBraintreeHostedReady = useCallback((tokenize) => {
    braintreeTokenizeRef.current = tokenize; // function OR null on unmount
  }, []);

  const strategyDeps = useMemo(() => ({
    braintreeHostedTokenize: () => {
      const fn = braintreeTokenizeRef.current;
      if (!fn) throw new Error('Card form not ready');
      return fn();
    },
  }), []);

  const submitPayment = usePaymentSubmit({
    state,
    actions,
    cartId,
    mutations,
    clearCart,
    navigate,
    strategyDeps,
  });

  const {
    handlePaymentMethodSelect,
    handlePayPalSuccess,
    handlePayPalError,
    handlePayPalCancel,
    handleAcceptJsToken,
    handleAuthorizeNetTransactionComplete,
    handleAuthorizeNetTransactionError,
    googlePayPlaceOrder,
    dismissErrorKey,
  } = useCheckoutPaymentHandlers({ state, actions, mutations, cartId, user, clearCart, navigate });

  // ──────────────────────────────────────── Loading / empty gates
  // Checkout's own data (countries list for the address form) loads separately
  // from the cart — keep the skeleton up until that essential data is ready,
  // otherwise the form flashes in with an empty country select. cartData alone
  // resolves instantly from cache, so it can't gate the checkout skeleton.
  const checkoutDataLoading = checkoutQueries.queries.countries.loading && !data.countries.length;
  if (cartLoading || cartMerging || !cartData || checkoutDataLoading) {
    return (
      <div className="checkout-container">
        <h1 className="checkout-title">Checkout</h1>

        <div className="co-skel-steps" aria-hidden="true">
          <span className="skeleton co-skel-step is-active" />
          <span className="skeleton co-skel-conn" />
          <span className="skeleton co-skel-step" />
          <span className="skeleton co-skel-conn" />
          <span className="skeleton co-skel-step" />
        </div>

        <div className="co-skel-section" aria-busy="true" aria-live="polite">
          <span className="skeleton co-skel-h" />
          <span className="skeleton co-skel-field" />
          <div className="co-skel-row">
            <span className="skeleton co-skel-field" />
            <span className="skeleton co-skel-field" />
          </div>
          <span className="skeleton co-skel-field" />
          <div className="co-skel-row co-skel-row-3">
            <span className="skeleton co-skel-field" />
            <span className="skeleton co-skel-field" />
            <span className="skeleton co-skel-field" />
          </div>
          <span className="skeleton co-skel-field" />
          <span className="skeleton co-skel-btn" />
        </div>
      </div>
    );
  }

  if (!cartData.items?.length) {
    return (
      <div className="checkout-container">
        <h1 className="checkout-title">Checkout</h1>
        <p className="empty-cart-message">Cart is empty</p>
      </div>
    );
  }

  // ──────────────────────────────────────── Render
  return (
    <div className="checkout-container">
      <h1 className="checkout-title">Checkout</h1>

      <CheckoutSteps currentStep={state.currentStep} setCurrentStep={actions.setStep} />

      <div className="co-layout">
        <div className="co-main">
          {state.currentStep === 1 && (
            <>
              <ShippingAddressForm
                shippingAddress={state.shippingAddress}
                setShippingAddress={actions.setShippingAddress}
                email={state.email}
                setEmail={actions.setEmail}
                billingAddress={state.billingAddress}
                setBillingAddress={actions.setBillingAddress}
                useSameAsShipping={state.useSameAsShipping}
                setUseSameAsShipping={actions.setUseSameAsShipping}
                errors={state.errors}
                loading={state.loading}
                handleAddressSubmit={addressMgr.submitAddress}
                usStates={selectedCountryRegions}
                countries={countries}
                optionalZipCountries={optionalZipCountries}
                isLoggedIn={!!user}
                customerAddresses={data.customerAddresses}
                showAddressSelector={state.showAddressSelector}
                isEditingAddress={state.isEditingAddress}
                selectedAddressId={state.selectedAddressId}
                onAddressSelect={addressMgr.selectSavedAddress}
                onEditAddress={addressMgr.editAddress}
                onNewAddress={addressMgr.addNewAddress}
                onBackToSelector={addressMgr.backToSelector}
                saveAddressToBook={state.saveAddressToBook}
                setSaveAddressToBook={actions.setSaveAddressToBook}
              />
              <CheckoutCoupon cartId={cartId} cartData={cartData} />
              <CheckoutGiftCard cartId={cartId} cartData={cartData} />
            </>
          )}

          {state.currentStep === 2 && (
            <ShippingMethodsForm
              shippingMethodsData={shippingMethods.data}
              errors={state.errors}
              selectedShipping={state.selectedShipping}
              handleShippingMethodSelect={shippingMgr.selectShippingMethod}
              handleShippingSubmit={shippingMgr.submitShippingMethod}
              shippingLoading={state.shippingLoading}
              loading={loading.shippingMethods}
            />
          )}

          {state.currentStep === 3 && (
            <PaymentMethodsForm
              paymentMethodsData={paymentMethods.data}
              errors={state.errors}
              selectedPayment={state.selectedPayment}
              handlePaymentMethodSelect={handlePaymentMethodSelect}
              handlePaymentSubmit={submitPayment}
              paymentLoading={state.paymentLoading}
              cardData={state.cardData}
              setCardData={actions.setCardData}
              loading={loading.paymentMethods}
              cartId={cartId}
              cartData={cartData}
              handlePayPalSuccess={handlePayPalSuccess}
              handlePayPalError={handlePayPalError}
              handlePayPalCancel={handlePayPalCancel}
              onAcceptJsToken={handleAcceptJsToken}
              tokenbaseConfig={data.tokenbaseConfig}
              onTransactionComplete={handleAuthorizeNetTransactionComplete}
              onTransactionError={handleAuthorizeNetTransactionError}
              guestEmail={user ? null : state.email}
              braintreeLoadClient={loadBraintreeClient}
              onBraintreeHostedReady={onBraintreeHostedReady}
              googlePayPlaceOrder={googlePayPlaceOrder}
              googlePayMerchantId={import.meta.env.VITE_GOOGLE_PAY_MERCHANT_ID}
              googlePayEnvironment={import.meta.env.VITE_GOOGLE_PAY_ENV || 'TEST'}
            />
          )}
        </div>
        <CheckoutSummary cartData={cartData} />
      </div>

      {typeof document !== 'undefined' && document.getElementById('toast-stack') && (
        <>
          {renderCheckoutToast(state.errors.general,  () => dismissErrorKey('general'))}
          {renderCheckoutToast(state.errors.shipping, () => dismissErrorKey('shipping'))}
          {renderCheckoutToast(state.errors.payment,  () => dismissErrorKey('payment'))}
          {renderCheckoutToast(state.errors.order,    () => dismissErrorKey('order'))}
        </>
      )}
    </div>
  );
};

function renderCheckoutToast(message, onClose) {
  if (!message || typeof document === 'undefined') return null;
  const target = document.getElementById('toast-stack');
  if (!target) return null;
  return createPortal(
    <div className="wl-toast wl-toast--error" role="alert" aria-live="assertive">
      <span className="wl-toast-text">{message}</span>
      <button type="button" className="wl-toast-close" onClick={onClose} aria-label="Dismiss">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>,
    target,
  );
}

export default Checkout;
