import React from 'react';
import AddressFormFields from '../account/AddressFormFields';
import CheckoutAddressCards from './CheckoutAddressCards';
import useAddressValidation from '../../hooks/useAddressValidation';
import { formatAddressLines } from '../../lib/addressLines';

const CheckoutBillingAddress = ({
    cartData,
    billingAddress,
    setBillingAddress,
    useSameAsShipping,
    billingEditing,
    billingLoading,
    billingAddressId,
    errors,
    usStates,
    countries = [],
    optionalZipCountries = [],
    isLoggedIn = false,
    customerAddresses = [],
    onToggleSameAsShipping,
    onSelectSaved,
    onNewAddress,
    onEdit,
    onApply,
    onCancel,
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

    const displayAddress = useSameAsShipping
        ? cartData?.shipping_addresses?.[0]
        : cartData?.billing_address;
    const lines = formatAddressLines(displayAddress);
    const showForm = !useSameAsShipping && billingEditing;
    const showSavedCards = isLoggedIn && customerAddresses.length > 0;
    const showFields = !showSavedCards || billingAddressId == null;

    const billingBtnCls = 'flex-none w-auto mt-0 h-11 px-[22px] py-[11px] gap-2.5 max768:w-full';

    return (
        <div className="co-billing mt-1 mb-3.5 px-5 py-[18px] border border-line rounded bg-bg flex flex-col gap-3.5">
            <label className="co-checkbox co-billing-same inline-flex items-center gap-2.5 cursor-pointer select-none text-base text-ink">
                <input
                    type="checkbox"
                    className="w-4 h-4 m-0 accent-ink cursor-pointer"
                    checked={useSameAsShipping}
                    disabled={billingLoading}
                    onChange={(e) => onToggleSameAsShipping(e.target.checked)}
                />
                <span className="leading-[1.4]">My billing and shipping address are the same</span>
            </label>

            {!showForm && lines.length > 0 && (
                <div className="co-billing-details flex items-start justify-between gap-4">
                    <address className="co-billing-address flex flex-col gap-0.5 not-italic text-sm leading-relaxed text-ink-2 [&>span:first-child]:text-ink [&>span:first-child]:font-medium [&>span:first-child]:text-base">
                        {lines.map((line) => <span key={line}>{line}</span>)}
                    </address>
                    {!useSameAsShipping && (
                        <button type="button" className="co-billing-edit shrink-0 border-0 p-0 text-sm text-ink underline underline-offset-[3px] [transition:opacity_120ms_ease] hover:opacity-70" onClick={onEdit}>
                            Edit
                        </button>
                    )}
                </div>
            )}

            {showForm && (
                <div className="co-billing-form flex flex-col gap-4 [&_.saved-addresses-grid]:mb-0">
                    {showSavedCards && (
                        <CheckoutAddressCards
                            addresses={customerAddresses}
                            selectedId={billingAddressId}
                            onSelect={onSelectSaved}
                            onNew={onNewAddress}
                            defaultFlag="default_billing"
                        />
                    )}
                    {showFields && (
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
                    )}
                    <div className="co-billing-actions flex gap-2.5 max768:flex-col">
                        <button
                            type="button"
                            className={`btn-primary ${billingBtnCls}${billingLoading ? ' loading' : ''}`}
                            disabled={billingLoading}
                            onClick={onApply}
                        >
                            Update
                        </button>
                        <button
                            type="button"
                            className={`btn-secondary ${billingBtnCls}`}
                            disabled={billingLoading}
                            onClick={onCancel}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckoutBillingAddress;
