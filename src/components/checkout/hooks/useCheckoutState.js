import { useReducer, useCallback } from 'react';

const EMPTY_ADDRESS = {
  firstname: '',
  lastname: '',
  street: [''],
  city: '',
  region: '',
  region_id: '',
  postcode: '',
  country_code: 'US',
  telephone: '',
};

const EMPTY_CARD = {
  number: '',
  expiryMonth: '',
  expiryYear: '',
  expiry: '',
  cvv: '',
  holderName: '',
};

const initialStateFactory = (initialStep) => ({
  currentStep: initialStep,
  completedSteps: new Set(),
  shippingAddress: { ...EMPTY_ADDRESS },
  billingAddress: { ...EMPTY_ADDRESS },
  email: '',
  useSameAsShipping: true,
  saveAddressToBook: false,
  billingAddressId: null,
  billingEditing: false,
  billingLoading: false,
  billingApplied: false,

  // ───────────────────────────────────────── Saved-address UX (logged-in)
  selectedAddressId: null,
  showAddressSelector: false,
  isEditingAddress: false,
  addressDataLoaded: false,

  // ───────────────────────────────────────── Shipping
  selectedShipping: '',
  shippingLoading: '',

  // ───────────────────────────────────────── Payment
  selectedPayment: '',
  cardData: { ...EMPTY_CARD },
  selectedVaultHash: '',
  saveCard: true,
  acceptJsToken: null,
  paymentLoading: false,
  orderLoading: false,

  // ───────────────────────────────────────── Errors / generic
  errors: {},
  loading: false,
});

function reducer(state, action) {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step };
    case 'COMPLETE_STEP': {
      const next = new Set(state.completedSteps);
      next.add(action.step);
      return { ...state, completedSteps: next };
    }
    case 'UNCOMPLETE_STEP': {
      if (!state.completedSteps.has(action.step)) return state;
      const next = new Set(state.completedSteps);
      next.delete(action.step);
      return { ...state, completedSteps: next };
    }
    case 'RESET_COMPLETED_STEPS':
      return { ...state, completedSteps: new Set() };

    case 'SET_SHIPPING_ADDRESS':
      return { ...state, shippingAddress: { ...state.shippingAddress, ...action.patch } };
    case 'REPLACE_SHIPPING_ADDRESS':
      return { ...state, shippingAddress: action.value };
    case 'SET_BILLING_ADDRESS':
      return { ...state, billingAddress: { ...state.billingAddress, ...action.patch } };
    case 'REPLACE_BILLING_ADDRESS':
      return { ...state, billingAddress: action.value };
    case 'SET_EMAIL':
      return { ...state, email: action.value };
    case 'SET_USE_SAME_AS_SHIPPING':
      return { ...state, useSameAsShipping: action.value };
    case 'SET_SAVE_ADDRESS_TO_BOOK':
      return { ...state, saveAddressToBook: action.value };
    case 'SET_BILLING_ADDRESS_ID':
      return { ...state, billingAddressId: action.value };
    case 'SET_BILLING_EDITING':
      return { ...state, billingEditing: action.value };
    case 'SET_BILLING_LOADING':
      return { ...state, billingLoading: action.value };
    case 'SET_BILLING_APPLIED':
      return { ...state, billingApplied: action.value };

    // Saved-address UX
    case 'SET_SELECTED_ADDRESS_ID':
      return { ...state, selectedAddressId: action.value };
    case 'SET_SHOW_ADDRESS_SELECTOR':
      return { ...state, showAddressSelector: action.value };
    case 'SET_IS_EDITING_ADDRESS':
      return { ...state, isEditingAddress: action.value };
    case 'SET_ADDRESS_DATA_LOADED':
      return { ...state, addressDataLoaded: action.value };

    case 'HYDRATE_FROM_CUSTOMER':
      return {
        ...state,
        shippingAddress: action.shippingAddress ?? state.shippingAddress,
        billingAddress: action.billingAddress ?? state.billingAddress,
        email: action.email ?? state.email,
        selectedAddressId: action.selectedAddressId ?? state.selectedAddressId,
        showAddressSelector:
          action.showAddressSelector ?? state.showAddressSelector,
        addressDataLoaded: true,
      };

    // Shipping
    case 'SET_SELECTED_SHIPPING':
      return { ...state, selectedShipping: action.value };
    case 'SET_SHIPPING_LOADING':
      return { ...state, shippingLoading: action.value };

    // Payment
    case 'SET_SELECTED_PAYMENT':
      return { ...state, selectedPayment: action.value };
    case 'SET_CARD_DATA':
      return { ...state, cardData: typeof action.value === 'function'
        ? action.value(state.cardData)
        : { ...state.cardData, ...action.value } };
    case 'SET_VAULT_HASH':
      return { ...state, selectedVaultHash: action.value };
    case 'SET_SAVE_CARD':
      return { ...state, saveCard: action.value };
    case 'SET_ACCEPT_JS_TOKEN':
      return { ...state, acceptJsToken: action.value };
    case 'SET_PAYMENT_LOADING':
      return { ...state, paymentLoading: action.value };
    case 'SET_ORDER_LOADING':
      return { ...state, orderLoading: action.value };

    // Errors / generic
    case 'SET_ERRORS':
      return { ...state, errors: action.value };
    case 'CLEAR_ERRORS':
      return { ...state, errors: {} };
    case 'SET_LOADING':
      return { ...state, loading: action.value };

    default:
      // Surface unknown actions in dev so typos don't silently no-op.
      if (typeof console !== 'undefined') {
        console.warn('[useCheckoutState] unknown action', action);
      }
      return state;
  }
}

export default function useCheckoutState(initialStep = 1) {
  const [state, rawDispatch] = useReducer(reducer, initialStep, initialStateFactory);

  const dispatch = useCallback(rawDispatch, [rawDispatch]);

  const actions = useCallback(() => ({
    setStep: (step) => dispatch({ type: 'SET_STEP', step }),
    completeStep: (step) => dispatch({ type: 'COMPLETE_STEP', step }),
    uncompleteStep: (step) => dispatch({ type: 'UNCOMPLETE_STEP', step }),
    resetCompletedSteps: () => dispatch({ type: 'RESET_COMPLETED_STEPS' }),

    setShippingAddress: (patch) => dispatch({ type: 'SET_SHIPPING_ADDRESS', patch }),
    replaceShippingAddress: (value) => dispatch({ type: 'REPLACE_SHIPPING_ADDRESS', value }),
    setBillingAddress: (patch) => dispatch({ type: 'SET_BILLING_ADDRESS', patch }),
    replaceBillingAddress: (value) => dispatch({ type: 'REPLACE_BILLING_ADDRESS', value }),
    setEmail: (value) => dispatch({ type: 'SET_EMAIL', value }),
    setUseSameAsShipping: (value) => dispatch({ type: 'SET_USE_SAME_AS_SHIPPING', value }),
    setSaveAddressToBook: (value) => dispatch({ type: 'SET_SAVE_ADDRESS_TO_BOOK', value }),
    setBillingAddressId: (value) => dispatch({ type: 'SET_BILLING_ADDRESS_ID', value }),
    setBillingEditing: (value) => dispatch({ type: 'SET_BILLING_EDITING', value }),
    setBillingLoading: (value) => dispatch({ type: 'SET_BILLING_LOADING', value }),
    setBillingApplied: (value) => dispatch({ type: 'SET_BILLING_APPLIED', value }),

    setSelectedAddressId: (value) => dispatch({ type: 'SET_SELECTED_ADDRESS_ID', value }),
    setShowAddressSelector: (value) => dispatch({ type: 'SET_SHOW_ADDRESS_SELECTOR', value }),
    setIsEditingAddress: (value) => dispatch({ type: 'SET_IS_EDITING_ADDRESS', value }),
    setAddressDataLoaded: (value) => dispatch({ type: 'SET_ADDRESS_DATA_LOADED', value }),
    hydrateFromCustomer: (payload) => dispatch({ type: 'HYDRATE_FROM_CUSTOMER', ...payload }),

    setSelectedShipping: (value) => dispatch({ type: 'SET_SELECTED_SHIPPING', value }),
    setShippingLoading: (value) => dispatch({ type: 'SET_SHIPPING_LOADING', value }),

    setSelectedPayment: (value) => dispatch({ type: 'SET_SELECTED_PAYMENT', value }),
    setCardData: (value) => dispatch({ type: 'SET_CARD_DATA', value }),
    setVaultHash: (value) => dispatch({ type: 'SET_VAULT_HASH', value }),
    setSaveCard: (value) => dispatch({ type: 'SET_SAVE_CARD', value }),
    setAcceptJsToken: (value) => dispatch({ type: 'SET_ACCEPT_JS_TOKEN', value }),
    setPaymentLoading: (value) => dispatch({ type: 'SET_PAYMENT_LOADING', value }),
    setOrderLoading: (value) => dispatch({ type: 'SET_ORDER_LOADING', value }),

    setErrors: (value) => dispatch({ type: 'SET_ERRORS', value }),
    clearErrors: () => dispatch({ type: 'CLEAR_ERRORS' }),
    setLoading: (value) => dispatch({ type: 'SET_LOADING', value }),
  }), [dispatch]);

  return { state, dispatch, actions: actions() };
}
