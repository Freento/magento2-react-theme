import React, { useState } from 'react';
import CheckoutAddressCards from './CheckoutAddressCards';
import ArrowLeftIcon from '../ui/icons/ArrowLeftIcon';
import AddressFormFields from '../account/AddressFormFields';
import useAddressValidation from '../../hooks/useAddressValidation';
import { validateEmail } from './validation/addressValidation';
import { FORM_SECTION_CLS, FORM_TITLE_CLS, CO_BTN_CLS, CO_SPINNER_CLS } from './checkoutUi';

const ShippingAddressForm = ({
    shippingAddress,
    setShippingAddress,
    email,
    setEmail,
    errors,
    loading,
    handleAddressSubmit,
    usStates,
    countries = [],
    isLoggedIn = false,
    customerAddresses = [],
    showAddressSelector = false,
    isEditingAddress = false,
    selectedAddressId = null,
    onAddressSelect = () => {},
    onEditAddress = () => {},
    onNewAddress = () => {},
    onBackToSelector = () => {},
    optionalZipCountries = [],
    saveAddressToBook = false,
    setSaveAddressToBook = () => {},
}) => {
    const addr = useAddressValidation(shippingAddress, {
        availableRegions: usStates,
        optionalZipCountries,
        externalErrors: errors,
    });
    const [emailTouched, setEmailTouched] = useState(false);
    const [emailLocal, setEmailLocal] = useState(null);
    const errEmail = emailLocal ?? errors.email;

    // Build a small object patch per change. Country change additionally
    // resets the dependent region fields. The reducer merges each patch
    // atomically (sequential dispatches accumulate), so the 3 onChange
    // calls AddressFormFields fires for state-picks (region_id + region
    // + region_code) all land in one round of updates.
    const handleFieldChange = (field, value) => {
        const patch = field === 'country_code'
            ? { country_code: value, region_id: null, region: '', region_code: '' }
            : { [field]: value };
        setShippingAddress(patch);
        // Compute the new form shape for validator context. Don't put
        // side effects inside setShippingAddress — the reducer is pure.
        const next = { ...shippingAddress, ...patch };
        if (field === 'country_code') addr.onCountryChange(value, next);
        addr.onLiveChange(field, value, next);
    };

    return (
        <div className={FORM_SECTION_CLS}>
            <h2 className={FORM_TITLE_CLS}>Shipping Address</h2>

            {/* Saved-address picker for logged-in customers. */}
            {isLoggedIn && showAddressSelector && !isEditingAddress && (
                <div className="address-selector mb-[22px]">
                    <CheckoutAddressCards
                        addresses={customerAddresses}
                        selectedId={selectedAddressId}
                        onSelect={onAddressSelect}
                        onNew={onNewAddress}
                    />
                    <button
                        type="button"
                        className={`btn-primary ${CO_BTN_CLS}`}
                        onClick={handleAddressSubmit}
                        disabled={loading || !selectedAddressId}
                    >
                        {loading && <div className={CO_SPINNER_CLS} />}
                        {loading ? 'Saving…' : 'Continue'}
                    </button>
                </div>
            )}

            {(!isLoggedIn || !showAddressSelector || isEditingAddress) && (
                <>
                    {isLoggedIn && showAddressSelector && isEditingAddress && customerAddresses.length > 0 && (
                        <button
                            type="button"
                            className="co-back-link inline-flex items-center gap-1 border-0 pb-3.5 text-ink-2 text-sm [transition:color_120ms_ease] hover:text-ink"
                            onClick={onBackToSelector}
                        >
                            <ArrowLeftIcon /> Use a saved address instead
                        </button>
                    )}
                    <form onSubmit={handleAddressSubmit} className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Email Address *</label>
                            <input
                                type="email"
                                autoComplete="email"
                                placeholder="Enter email address"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (emailLocal) {
                                        const err = validateEmail(e.target.value);
                                        if (!err) setEmailLocal(null);
                                    }
                                }}
                                onBlur={(e) => {
                                    setEmailTouched(true);
                                    setEmailLocal(validateEmail(e.target.value));
                                }}
                                required
                                className={`form-input ${errEmail ? 'error' : ''}`}
                            />
                            {errEmail && <div className="form-error">{errEmail}</div>}
                        </div>

                        <AddressFormFields
                            value={shippingAddress}
                            onChange={handleFieldChange}
                            onBlur={addr.onBlur}
                            errors={addr.errors}
                            countries={countries}
                            availableRegions={usStates}
                            optionalZipCountries={optionalZipCountries}
                            idPrefix="shipping"
                        />

                        {/* Save-to-book opt-in. Only logged-in users have an
                            address book to save into; guests don't see this. */}
                        {isLoggedIn && (
                            <label className="co-checkbox inline-flex items-center gap-2.5 cursor-pointer select-none text-base text-ink">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 m-0 accent-ink cursor-pointer"
                                    checked={!!saveAddressToBook}
                                    onChange={(e) => setSaveAddressToBook(e.target.checked)}
                                />
                                <span className="leading-[1.4]">Save this address to my address book</span>
                            </label>
                        )}

                        <button type="submit" disabled={loading} className={`btn-primary ${CO_BTN_CLS}`}>
                            {loading && <div className={CO_SPINNER_CLS} />}
                            {loading ? 'Processing…' : 'Continue'}
                        </button>
                    </form>
                </>
            )}
        </div>
    );
};

export default ShippingAddressForm;
