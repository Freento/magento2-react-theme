import React from 'react';

const ShippingMethodsForm = ({
    shippingMethodsData,
    errors,
    selectedShipping,
    handleShippingMethodSelect,
    handleShippingSubmit,
    shippingLoading,
    loading
}) => {
    return (
        <div className="form-section">
            <h2 className="form-title">Shipping Methods</h2>

            {loading ? (
                <div className="shipping-methods-list" aria-busy="true" aria-live="polite">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={`sk-${i}`} className="shipping-method-item is-skel" aria-hidden="true">
                            <div className="shipping-method-content">
                                <div className="shipping-method-info">
                                    <span className="skeleton co-skel-radio" />
                                    <div className="co-skel-method-text">
                                        <span className="skeleton co-skel-method-title" />
                                        <span className="skeleton co-skel-method-desc" />
                                    </div>
                                </div>
                                <span className="skeleton co-skel-method-price" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (() => {
                // Magento returns ALL configured methods in the list; each has
                // an `available: Boolean` flag. Methods with `available === false`
                // are things like FedEx INTERNATIONAL for a US address — the
                // carrier rejects them when we try to set them on the cart.
                // Treat null/undefined as available (back-compat with older
                // Magento versions where the field isn't populated).
                const all = shippingMethodsData?.cart?.shipping_addresses?.[0]?.available_shipping_methods || [];
                const methods = all.filter((m) => m.available !== false);
                return methods.length > 0 ? (
                <div className="shipping-methods-list">
                    {methods.map((method) => {
                        const methodCode = method.method_code || method.carrier_code || 'default';
                        const shippingKey = `${method.carrier_code}_${methodCode}`;
                        const isSelected = selectedShipping === shippingKey;

                        return (
                            <div
                                key={shippingKey}
                                className={`shipping-method-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleShippingMethodSelect(method.carrier_code, methodCode)}
                            >
                                <div className="shipping-method-content">
                                    <div className="shipping-method-info">
                                        <div className={`radio-button ${isSelected ? 'selected' : ''}`} />
                                        <div>
                                            <h3 className="shipping-method-title">{method.carrier_title}</h3>
                                            <p className="shipping-method-description">{method.method_title}</p>
                                        </div>
                                    </div>
                                    <div className="shipping-method-price">
                                        ${method.amount.value.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                ) : (
                    <p>No shipping methods available. Please check your address.</p>
                );
            })()}

            <button
                onClick={handleShippingSubmit}
                disabled={shippingLoading}
                className="btn-primary"
            >
                {shippingLoading && (
                    <div className="loading-spinner" />
                )}
                {shippingLoading ? 'Processing…' : 'Continue'}
            </button>
        </div>
    );
};

export default ShippingMethodsForm;