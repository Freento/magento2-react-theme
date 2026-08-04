import React, { useState } from 'react';
import BillingAddressForm from './BillingAddressForm';
import AddressFormFields from '../account/AddressFormFields';
import useAddressValidation from '../../hooks/useAddressValidation';
import { validateEmail } from './validation/addressValidation';

const ShippingAddressForm = ({
    shippingAddress,
    setShippingAddress,
    email,
    setEmail,
    billingAddress,
    setBillingAddress,
    useSameAsShipping,
    setUseSameAsShipping,
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
        <div className="form-section">
            <h2 className="form-title">Shipping Address</h2>

            {/* Saved-address picker for logged-in customers. */}
            {isLoggedIn && showAddressSelector && !isEditingAddress && (
                <div className="address-selector">
                    <div className="saved-addresses-grid">
                        {customerAddresses.map((address) => {
                            const isSelected = selectedAddressId === address.id;
                            return (
                                <div
                                    key={address.id}
                                    role="radio"
                                    aria-checked={isSelected}
                                    tabIndex={0}
                                    className={`co-address-card ${isSelected ? 'selected' : ''}`}
                                    onClick={() => onAddressSelect(address)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            onAddressSelect(address);
                                        }
                                    }}
                                >
                                    <div className="co-address-card-radio" aria-hidden="true" />
                                    <div className="co-address-card-content">
                                        <div className="address-card-head">
                                            <strong>{address.firstname} {address.lastname}</strong>
                                            {address.default_shipping && (
                                                <span className="address-default-badge">Default</span>
                                            )}
                                        </div>
                                        <div className="address-card-body">
                                            <div>{address.street?.join(', ')}</div>
                                            <div>{address.city}, {address.region?.region || ''} {address.postcode}</div>
                                            <div>{address.country_code}</div>
                                            {address.telephone && <div>Tel: {address.telephone}</div>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <button
                            type="button"
                            className="co-address-card co-address-card--add"
                            onClick={onNewAddress}
                        >
                            <span className="co-address-card-plus" aria-hidden="true">+</span>
                            <span className="co-address-card-add-label">Add new address</span>
                        </button>
                    </div>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleAddressSubmit}
                        disabled={loading || !selectedAddressId}
                    >
                        {loading && <div className="loading-spinner" />}
                        {loading ? 'Saving…' : 'Continue'}
                    </button>
                </div>
            )}

            {(!isLoggedIn || !showAddressSelector || isEditingAddress) && (
                <>
                    {isLoggedIn && showAddressSelector && isEditingAddress && customerAddresses.length > 0 && (
                        <button
                            type="button"
                            className="co-back-link"
                            onClick={onBackToSelector}
                        >
                            ← Use a saved address instead
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

                        <BillingAddressForm
                            billingAddress={billingAddress}
                            setBillingAddress={setBillingAddress}
                            useSameAsShipping={useSameAsShipping}
                            setUseSameAsShipping={setUseSameAsShipping}
                            errors={errors}
                            usStates={usStates}
                            countries={countries}
                            optionalZipCountries={optionalZipCountries}
                        />

                        {/* Save-to-book opt-in. Only logged-in users have an
                            address book to save into; guests don't see this. */}
                        {isLoggedIn && (
                            <label className="co-checkbox">
                                <input
                                    type="checkbox"
                                    checked={!!saveAddressToBook}
                                    onChange={(e) => setSaveAddressToBook(e.target.checked)}
                                />
                                <span>Save this address to my address book</span>
                            </label>
                        )}

                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading && <div className="loading-spinner" />}
                            {loading ? 'Processing…' : 'Continue'}
                        </button>
                    </form>
                </>
            )}
        </div>
    );
};

export default ShippingAddressForm;
