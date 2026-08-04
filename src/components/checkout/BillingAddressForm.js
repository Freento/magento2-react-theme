import React from 'react';
import AddressFormFields from '../account/AddressFormFields';
import useAddressValidation from '../../hooks/useAddressValidation';

const BillingAddressForm = ({
    billingAddress,
    setBillingAddress,
    useSameAsShipping,
    setUseSameAsShipping,
    errors,
    usStates,
    countries = [],
    optionalZipCountries = [],
}) => {
    const externalErrors = Object.fromEntries(
        Object.entries(errors || {})
            .filter(([k]) => k.startsWith('billing_'))
            .map(([k, v]) => [k.replace(/^billing_/, ''), v])
    );
    const addr = useAddressValidation(billingAddress, {
        availableRegions: usStates,
        optionalZipCountries,
        externalErrors,
    });

    const handleFieldChange = (field, value) => {
        const patch = field === 'country_code'
            ? { country_code: value, region_id: null, region: '', region_code: '' }
            : { [field]: value };
        setBillingAddress(patch);
        const next = { ...billingAddress, ...patch };
        if (field === 'country_code') addr.onCountryChange(value, next);
        addr.onLiveChange(field, value, next);
    };

    return (
        <div className="billing-section">
            <h3 className="billing-section-title">Billing Address</h3>

            <label className="co-checkbox">
                <input
                    type="checkbox"
                    checked={useSameAsShipping}
                    onChange={(e) => setUseSameAsShipping(e.target.checked)}
                />
                <span>Use same address as shipping</span>
            </label>

            {!useSameAsShipping && (
                <div className="billing-fields">
                    <AddressFormFields
                        value={billingAddress}
                        onChange={handleFieldChange}
                        onBlur={addr.onBlur}
                        errors={addr.errors}
                        countries={countries}
                        availableRegions={usStates}
                        optionalZipCountries={optionalZipCountries}
                        idPrefix="billing"
                    />
                </div>
            )}
        </div>
    );
};

export default BillingAddressForm;
