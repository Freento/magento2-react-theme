import React from 'react';
import {
    FORM_SECTION_CLS,
    FORM_TITLE_CLS,
    CO_BTN_CLS,
    CO_SPINNER_CLS,
    CO_EMPTY_NOTE_CLS,
    METHOD_ITEM_CLS,
    METHOD_ITEM_ON,
    METHOD_ITEM_OFF,
    RADIO_BTN_CLS,
    RADIO_BTN_ON,
    RADIO_BTN_OFF,
} from './checkoutUi';

const METHOD_CONTENT_CLS = 'shipping-method-content flex items-center justify-between gap-5 max480:flex-wrap max480:gap-y-2';
const METHOD_INFO_CLS = 'shipping-method-info flex items-center gap-3.5 min-w-0 flex-1';

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
        <div className={FORM_SECTION_CLS}>
            <h2 className={FORM_TITLE_CLS}>Shipping Methods</h2>

            {loading ? (
                <div className="shipping-methods-list grid gap-2 mb-2" aria-busy="true" aria-live="polite">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={`sk-${i}`} className="shipping-method-item is-skel block border border-line rounded px-5 py-[18px] bg-bg cursor-default pointer-events-none" aria-hidden="true">
                            <div className={METHOD_CONTENT_CLS}>
                                <div className={METHOD_INFO_CLS}>
                                    <span className="skeleton co-skel-radio w-[18px] h-[18px] rounded-full shrink-0" />
                                    <div className="co-skel-method-text flex flex-col gap-1.5 flex-1 min-w-0">
                                        <span className="skeleton co-skel-method-title w-3/5 h-3.5" />
                                        <span className="skeleton co-skel-method-desc w-2/5 h-[11px]" />
                                    </div>
                                </div>
                                <span className="skeleton co-skel-method-price w-16 h-4 shrink-0" />
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
                <div className="shipping-methods-list grid gap-2 mb-2">
                    {methods.map((method) => {
                        const methodCode = method.method_code || method.carrier_code || 'default';
                        const shippingKey = `${method.carrier_code}_${methodCode}`;
                        const isSelected = selectedShipping === shippingKey;

                        return (
                            <div
                                key={shippingKey}
                                className={`shipping-method-item ${METHOD_ITEM_CLS} ${isSelected ? METHOD_ITEM_ON : METHOD_ITEM_OFF}`}
                                onClick={() => handleShippingMethodSelect(method.carrier_code, methodCode)}
                            >
                                <div className={METHOD_CONTENT_CLS}>
                                    <div className={METHOD_INFO_CLS}>
                                        <div className={`${RADIO_BTN_CLS} ${isSelected ? RADIO_BTN_ON : RADIO_BTN_OFF}`} />
                                        <div>
                                            <h3 className="shipping-method-title mb-0.5 font-sans text-base font-medium tracking-[-0.005em] text-ink leading-[1.35]">{method.carrier_title}</h3>
                                            <p className="shipping-method-description text-sm text-ink-2 leading-[1.4]">{method.method_title}</p>
                                        </div>
                                    </div>
                                    <div className="shipping-method-price text-base font-semibold text-ink tabular-nums tracking-[-0.01em] whitespace-nowrap max480:ml-auto">
                                        ${method.amount.value.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                ) : (
                    <p className={CO_EMPTY_NOTE_CLS}>No shipping methods available. Please check your address.</p>
                );
            })()}

            <button
                onClick={handleShippingSubmit}
                disabled={shippingLoading}
                className={`btn-primary ${CO_BTN_CLS}`}
            >
                {shippingLoading && (
                    <div className={CO_SPINNER_CLS} />
                )}
                {shippingLoading ? 'Processing…' : 'Continue'}
            </button>
        </div>
    );
};

export default ShippingMethodsForm;
