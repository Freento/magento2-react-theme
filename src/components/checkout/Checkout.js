import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

import CheckoutSteps from './CheckoutSteps';
import ShippingAddressForm from './ShippingAddressForm';
import ShippingMethodsForm from './ShippingMethodsForm';
import PaymentMethodsForm from './PaymentMethodsForm';
import CheckoutSummary from './CheckoutSummary';
import CheckoutCoupon from './CheckoutCoupon';
import CheckoutBillingAddress from './CheckoutBillingAddress';

import useCheckoutState from './hooks/useCheckoutState';
import useCheckoutQueries from './hooks/useCheckoutQueries';
import useAddressManagement from './hooks/useAddressManagement';
import useShippingMethod from './hooks/useShippingMethod';
import useBillingAddress from './hooks/useBillingAddress';
import usePaymentSubmit from './hooks/usePaymentSubmit';
import useCheckoutPaymentHandlers from './hooks/useCheckoutPaymentHandlers';
import { isCartAuthError, getInitialStep } from './checkoutHelpers';
import { loadBraintreeClient } from './lib/braintree';

const CONTAINER_CLS = 'checkout-container max-w-container mx-auto px-gutter pt-8 pb-20 text-ink';
const TITLE_CLS = 'checkout-title font-sans text-2xl font-semibold tracking-[-0.02em] leading-tight mb-7';
const SKEL_STEP_CLS = 'skeleton co-skel-step h-3.5 rounded';
const SKEL_CONN_CLS = 'skeleton co-skel-conn grow-0 shrink-0 basis-12 h-px bg-line-strong animate-none';
const SKEL_FIELD_CLS = 'skeleton co-skel-field h-11 rounded';

const Checkout = () => {
  const { cartData, cartId, cartInitialized, loading: cartLoading, merging: cartMerging, clearCart, loadCart } = useCart();
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

  const estimatePrefilled = useRef(false);
  const shippingFormRef = useRef(state.shippingAddress);
  shippingFormRef.current = state.shippingAddress;
  useEffect(() => {
    if (estimatePrefilled.current || user) return;
    const addr = cartData?.shipping_addresses?.[0];
    if (!addr?.country?.code) return;
    estimatePrefilled.current = true;
    const form = shippingFormRef.current;
    if (form.firstname || form.city || form.postcode || form.street?.some(Boolean)) return;
    const clean = (v) => (v && v !== '-' && v !== '00000' ? v : '');
    const street = (addr.street || []).map(clean).filter(Boolean);
    actions.setShippingAddress({
      country_code: addr.country.code,
      ...(addr.region?.region_id
        ? { region_id: String(addr.region.region_id), region: addr.region.label || addr.region.code || '' }
        : {}),
      postcode: clean(addr.postcode),
      city: clean(addr.city),
      firstname: clean(addr.firstname),
      lastname: clean(addr.lastname),
      street: street.length ? street : [''],
      telephone: clean(addr.telephone),
    });
  }, [cartData, user, actions]);

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

  const billingCountryRegions = useMemo(
    () =>
      countries.find((c) => c.two_letter_abbreviation === state.billingAddress.country_code)
        ?.available_regions || [],
    [countries, state.billingAddress.country_code],
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

  const billingMgr = useBillingAddress({
    state,
    actions,
    cartId,
    user,
    customerAddresses: data.customerAddresses,
    cartBillingAddress: cartData?.billing_address || null,
    mutations,
    refetchPaymentMethods: refetch.paymentMethods,
    availableRegions: billingCountryRegions,
    optionalZipCountries,
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

  useEffect(() => {
    if (state.currentStep !== 3 || cartLoading || cartMerging || !cartData?.items?.length) return;
    const addr = cartData.shipping_addresses?.[0];
    if (!addr?.street?.length) {
      actions.setErrors({ general: 'Shipping address is missing. Please re-enter your shipping address.' });
      actions.setStep(1);
    } else if (!addr.selected_shipping_method) {
      actions.setErrors({ shipping: 'Please select a shipping method to continue.' });
      actions.setStep(2);
    }
  }, [state.currentStep, cartLoading, cartMerging, cartData, actions]);

  useEffect(() => {
    if (state.currentStep !== 3 || state.selectedPayment) return;
    const first = paymentMethods.data?.cart?.available_payment_methods
      ?.find((m) => m.code !== 'braintree_cc_vault');
    if (first?.code) handlePaymentMethodSelect(first.code);
  }, [state.currentStep, state.selectedPayment, paymentMethods.data, handlePaymentMethodSelect]);

  // ──────────────────────────────────────── Loading / empty gates
  // Checkout's own data (countries list for the address form) loads separately
  // from the cart — keep the skeleton up until that essential data is ready,
  // otherwise the form flashes in with an empty country select. cartData alone
  // resolves instantly from cache, so it can't gate the checkout skeleton.
  const checkoutDataLoading = checkoutQueries.queries.countries.loading && !data.countries.length;
  const guestWithoutCart = cartInitialized && !cartId && !cartData;
  if (cartLoading || cartMerging || checkoutDataLoading || (!cartData && !guestWithoutCart)) {
    return (
      <div className={CONTAINER_CLS}>
        <h1 className={TITLE_CLS}>Checkout</h1>

        <div className="co-skel-steps flex items-center gap-3.5 pb-5 mb-7 border-b border-line" aria-hidden="true">
          <span className={`${SKEL_STEP_CLS} w-[120px] opacity-70`} />
          <span className={SKEL_CONN_CLS} />
          <span className={`${SKEL_STEP_CLS} w-24`} />
          <span className={SKEL_CONN_CLS} />
          <span className={`${SKEL_STEP_CLS} w-24`} />
        </div>

        <div className="co-skel-section bg-bg border border-line rounded p-7 grid gap-4 max640:px-4 max640:py-5" aria-busy="true" aria-live="polite">
          <span className="skeleton co-skel-h w-2/5 h-[22px]" />
          <span className={SKEL_FIELD_CLS} />
          <div className="co-skel-row grid grid-cols-2 gap-4 max640:grid-cols-1">
            <span className={SKEL_FIELD_CLS} />
            <span className={SKEL_FIELD_CLS} />
          </div>
          <span className={SKEL_FIELD_CLS} />
          <div className="co-skel-row co-skel-row-3 grid grid-cols-3 gap-4 max640:grid-cols-1">
            <span className={SKEL_FIELD_CLS} />
            <span className={SKEL_FIELD_CLS} />
            <span className={SKEL_FIELD_CLS} />
          </div>
          <span className={SKEL_FIELD_CLS} />
          <span className="skeleton co-skel-btn h-11 mt-2 rounded" />
        </div>
      </div>
    );
  }

  if (!cartData?.items?.length) {
    return (
      <div className={CONTAINER_CLS}>
        <h1 className={TITLE_CLS}>Checkout</h1>
        <p className="empty-cart-message px-6 py-16 text-center text-ink-2 text-base">Cart is empty</p>
      </div>
    );
  }

  // ──────────────────────────────────────── Render
  return (
    <div className={CONTAINER_CLS}>
      <h1 className={TITLE_CLS}>Checkout</h1>

      <CheckoutSteps currentStep={state.currentStep} setCurrentStep={actions.setStep} />

      <div className="co-layout grid grid-cols-[minmax(0,1fr)_340px] gap-7 items-start max900:grid-cols-1">
        <div className="co-main min-w-0">
          {state.currentStep === 1 && (
            <ShippingAddressForm
              shippingAddress={state.shippingAddress}
              setShippingAddress={actions.setShippingAddress}
              email={state.email}
              setEmail={actions.setEmail}
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
            <>
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
                placeOrderDisabled={!state.useSameAsShipping && state.billingEditing}
                selectedVaultHash={state.selectedVaultHash}
                onVaultSelect={actions.setVaultHash}
                saveCard={state.saveCard}
                onSaveCardChange={actions.setSaveCard}
                canSaveCard={!!user}
                billingBlock={(
                  <CheckoutBillingAddress
                    cartData={cartData}
                    billingAddress={state.billingAddress}
                    setBillingAddress={actions.setBillingAddress}
                    useSameAsShipping={state.useSameAsShipping}
                    billingEditing={state.billingEditing}
                    billingLoading={state.billingLoading}
                    billingAddressId={state.billingAddressId}
                    errors={state.errors}
                    usStates={billingCountryRegions}
                    countries={countries}
                    optionalZipCountries={optionalZipCountries}
                    isLoggedIn={!!user}
                    customerAddresses={data.customerAddresses}
                    onToggleSameAsShipping={billingMgr.toggleSameAsShipping}
                    onSelectSaved={billingMgr.selectSavedAddress}
                    onNewAddress={billingMgr.addNewAddress}
                    onEdit={billingMgr.startEditing}
                    onApply={billingMgr.applyBilling}
                    onCancel={billingMgr.cancelEditing}
                  />
                )}
              />
              <CheckoutCoupon cartId={cartId} cartData={cartData} onChanged={refetch.paymentMethods} />
            </>
          )}
        </div>
        <CheckoutSummary
          cartData={cartData}
          showShippingInfo={state.currentStep === 3}
          onEditShippingAddress={() => actions.setStep(1)}
          onEditShippingMethod={() => actions.setStep(2)}
        />
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
