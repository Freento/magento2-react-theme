import { useCallback } from 'react';
import { validateAddress } from '../validation/addressValidation';

const OPTIONAL_ZIP_FALLBACK = [];

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

const buildAddressFields = (addr, saveToBook = false) => {
  const fields = {
    firstname: addr.firstname,
    lastname: addr.lastname,
    street: addr.street,
    city: addr.city,
    postcode: addr.postcode,
    country_code: addr.country_code,
    telephone: addr.telephone,
    save_in_address_book: !!saveToBook,
  };
  if (addr.region_id) fields.region_id = addr.region_id;
  else if (addr.region) fields.region = addr.region;
  return fields;
};

export default function useAddressManagement({
  state,
  actions,
  cartId,
  user,
  customerAddresses,
  mutations,
  navigate,
  isCartAuthError,
}) {
  const selectSavedAddress = useCallback((address) => {
    actions.setSelectedAddressId(address.id);
    actions.replaceShippingAddress({
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
    actions.setIsEditingAddress(false);
  }, [actions]);

  const editAddress = useCallback(() => actions.setIsEditingAddress(true), [actions]);

  const backToSelector = useCallback(() => {
    actions.setIsEditingAddress(false);
    const fallback = customerAddresses.find((a) => a.default_shipping) || customerAddresses[0];
    if (fallback) selectSavedAddress(fallback);
  }, [actions, customerAddresses, selectSavedAddress]);

  // "+ Add new address" — clear form to blanks, hide the selector.
  const addNewAddress = useCallback(() => {
    actions.setSelectedAddressId(null);
    actions.replaceShippingAddress({ ...EMPTY_FIELDS });
    actions.setIsEditingAddress(true);
  }, [actions]);

  const submitAddress = useCallback(async (e) => {
    if (e?.preventDefault) e.preventDefault();
    actions.setLoading(true);
    actions.clearErrors();

    const usingSavedAddress = !!state.selectedAddressId && !state.isEditingAddress;

    if (!usingSavedAddress) {
      const errors = validateAddress(
        state.shippingAddress,
        state.email,
        state.billingAddress,
        state.useSameAsShipping,
        OPTIONAL_ZIP_FALLBACK,
      );
      if (Object.keys(errors).length > 0) {
        actions.setErrors(errors);
        actions.setLoading(false);
        return;
      }
    }

    try {
      let addressFields = null;
      let customerAddressId = null;
      const persistFreshAddress = !!user && !!state.saveAddressToBook;
      if (usingSavedAddress) {
        customerAddressId = Number(state.selectedAddressId);
      } else {
        addressFields = buildAddressFields(state.shippingAddress, persistFreshAddress);
      }

      const shippingResult = user
        ? await mutations.setShippingAddressForCustomer({
            variables: { cartId, shippingAddress: addressFields, customerAddressId },
          })
        : await mutations.setShippingAddressAndEmail({
            variables: { cartId, shippingAddress: addressFields, customerAddressId, email: state.email },
          });

      let billingAddressFields = null;
      let billingCustomerAddressId = null;
      if (state.useSameAsShipping) {
        billingAddressFields = addressFields;
        billingCustomerAddressId = customerAddressId;
      } else {
        billingAddressFields = buildAddressFields(state.billingAddress, persistFreshAddress);
      }
      await mutations.setBillingAddress({
        variables: {
          cartId,
          billingAddress: billingAddressFields,
          billingCustomerAddressId,
          sameAsShipping: state.useSameAsShipping,
        },
      });

      const savedAddress = shippingResult?.data?.setShippingAddressesOnCart?.cart?.shipping_addresses?.[0];
      if (!savedAddress || !savedAddress.street?.length) {
        actions.setErrors({ general: 'Failed to save shipping address. Please verify all fields are filled correctly and try again.' });
        actions.setLoading(false);
        return;
      }
      if (!savedAddress.available_shipping_methods?.length) {
        actions.setErrors({ general: 'No shipping methods available for this address. Please verify your address is correct.' });
        actions.setLoading(false);
        return;
      }

      actions.completeStep(1);
      actions.setStep(2);
    } catch (error) {
      console.error('Error setting shipping address:', error);
      if (isCartAuthError(error)) {
        navigate('/', { replace: true });
        return;
      }
      const errorMessage = error.graphQLErrors?.[0]?.message
        || 'Failed to set shipping address. Please try again.';
      actions.setErrors({ general: errorMessage });
    } finally {
      actions.setLoading(false);
    }
  }, [state, actions, cartId, user, mutations, navigate, isCartAuthError]);

  return {
    selectSavedAddress,
    editAddress,
    backToSelector,
    addNewAddress,
    submitAddress,
  };
}
