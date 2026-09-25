import { useCallback } from 'react';
import { validateAddressAll } from '../validation/addressValidation';

const EMPTY_FIELDS = {
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

const fromCustomerAddress = (address) => ({
  firstname: address.firstname || '',
  lastname: address.lastname || '',
  street: address.street || [''],
  city: address.city || '',
  region: address.region?.region || '',
  region_id: address.region?.region_id || '',
  postcode: address.postcode || '',
  country_code: address.country_code || 'US',
  telephone: address.telephone || '',
});

const fromCartAddress = (address) => ({
  firstname: address.firstname || '',
  lastname: address.lastname || '',
  street: address.street?.length ? [...address.street] : [''],
  city: address.city || '',
  region: address.region?.label || address.region?.code || '',
  region_id: address.region?.region_id ? String(address.region.region_id) : '',
  postcode: address.postcode || '',
  country_code: address.country?.code || 'US',
  telephone: address.telephone || '',
});

const buildAddressFields = (addr) => {
  const fields = {
    firstname: addr.firstname,
    lastname: addr.lastname,
    street: (addr.street || []).filter(Boolean),
    city: addr.city,
    postcode: addr.postcode,
    country_code: addr.country_code,
    telephone: addr.telephone,
    save_in_address_book: false,
  };
  if (addr.region_id) fields.region_id = Number(addr.region_id);
  else if (addr.region) fields.region = addr.region;
  return fields;
};

const withoutBillingErrors = (errors) =>
  Object.fromEntries(Object.entries(errors || {}).filter(([k]) => !k.startsWith('billing_')));

export default function useBillingAddress({
  state,
  actions,
  cartId,
  user,
  customerAddresses,
  cartBillingAddress,
  mutations,
  refetchPaymentMethods,
  availableRegions,
  optionalZipCountries,
  navigate,
  isCartAuthError,
}) {
  const selectSavedAddress = useCallback((address) => {
    actions.setBillingAddressId(address.id);
    actions.replaceBillingAddress(fromCustomerAddress(address));
    actions.setErrors(withoutBillingErrors(state.errors));
  }, [actions, state.errors]);

  const addNewAddress = useCallback(() => {
    actions.setBillingAddressId(null);
    actions.replaceBillingAddress({ ...EMPTY_FIELDS });
  }, [actions]);

  const startEditing = useCallback(() => {
    if (user && customerAddresses.length > 0 && state.billingAddressId == null && !state.billingAddress.firstname) {
      const def = customerAddresses.find((a) => a.default_billing)
        || customerAddresses.find((a) => a.id === state.selectedAddressId)
        || customerAddresses[0];
      if (def) selectSavedAddress(def);
    }
    actions.setBillingEditing(true);
  }, [user, customerAddresses, state.billingAddressId, state.billingAddress.firstname, state.selectedAddressId, selectSavedAddress, actions]);

  const handleError = useCallback((error, fallback) => {
    if (isCartAuthError(error)) {
      navigate('/', { replace: true });
      return;
    }
    actions.setErrors({ ...withoutBillingErrors(state.errors), payment: error?.graphQLErrors?.[0]?.message || error?.message || fallback });
  }, [actions, state.errors, navigate, isCartAuthError]);

  const useShippingAsBilling = useCallback(async () => {
    actions.setBillingLoading(true);
    try {
      await mutations.setBillingAddress({
        variables: { cartId, billingAddress: null, billingCustomerAddressId: null, sameAsShipping: true },
      });
      actions.setUseSameAsShipping(true);
      actions.setBillingApplied(false);
      actions.setBillingEditing(false);
      actions.setErrors(withoutBillingErrors(state.errors));
      refetchPaymentMethods?.();
    } catch (error) {
      handleError(error, 'Could not update the billing address.');
    } finally {
      actions.setBillingLoading(false);
    }
  }, [actions, mutations, cartId, state.errors, refetchPaymentMethods, handleError]);

  const toggleSameAsShipping = useCallback((checked) => {
    if (checked) {
      useShippingAsBilling();
      return;
    }
    actions.setUseSameAsShipping(false);
    startEditing();
  }, [useShippingAsBilling, actions, startEditing]);

  const applyBilling = useCallback(async () => {
    const usingSaved = !!user && state.billingAddressId != null;
    if (!usingSaved) {
      const fieldErrors = validateAddressAll(state.billingAddress, { availableRegions, optionalZipCountries });
      if (Object.keys(fieldErrors).length > 0) {
        actions.setErrors({
          ...withoutBillingErrors(state.errors),
          ...Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [`billing_${k}`, v])),
        });
        return;
      }
    }
    actions.setBillingLoading(true);
    try {
      await mutations.setBillingAddress({
        variables: {
          cartId,
          billingAddress: usingSaved ? null : buildAddressFields(state.billingAddress),
          billingCustomerAddressId: usingSaved ? Number(state.billingAddressId) : null,
          sameAsShipping: false,
        },
      });
      actions.setBillingApplied(true);
      actions.setBillingEditing(false);
      actions.setErrors(withoutBillingErrors(state.errors));
      refetchPaymentMethods?.();
    } catch (error) {
      handleError(error, 'Could not update the billing address.');
    } finally {
      actions.setBillingLoading(false);
    }
  }, [user, state.billingAddressId, state.billingAddress, state.errors, availableRegions, optionalZipCountries, actions, mutations, cartId, refetchPaymentMethods, handleError]);

  const cancelEditing = useCallback(() => {
    actions.setErrors(withoutBillingErrors(state.errors));
    if (state.billingApplied) {
      if (state.billingAddressId == null && cartBillingAddress) {
        actions.replaceBillingAddress(fromCartAddress(cartBillingAddress));
      }
      actions.setBillingEditing(false);
      return;
    }
    useShippingAsBilling();
  }, [actions, state.errors, state.billingApplied, state.billingAddressId, cartBillingAddress, useShippingAsBilling]);

  return {
    selectSavedAddress,
    addNewAddress,
    startEditing,
    toggleSameAsShipping,
    applyBilling,
    cancelEditing,
  };
}
