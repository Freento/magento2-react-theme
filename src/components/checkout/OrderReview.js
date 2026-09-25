import React from 'react';
import { FORM_SECTION_CLS, FORM_TITLE_CLS, CO_BTN_CLS, CO_SPINNER_CLS } from './checkoutUi';

const OrderReview = ({
    cartData,
    errors,
    handlePlaceOrder,
    orderLoading
}) => {
    return (
        <div className={FORM_SECTION_CLS}>
            <h2 className={FORM_TITLE_CLS}>Review Your Order</h2>

            <div className="order-summary-container border border-line rounded p-[22px] mb-[22px] bg-bg">
                <h3 className="order-summary-title mb-3.5 text-xs font-medium tracking-eyebrow uppercase text-ink-2">Order Summary</h3>
                {cartData.items.map((item) => (
                    <div key={item.id} className="order-item flex justify-between items-baseline gap-3.5 py-2.5 border-b border-line last-of-type:border-b-0">
                        <div className="order-item-info flex items-baseline gap-1.5 text-base text-ink min-w-0">
                            <span className="font-medium overflow-hidden text-ellipsis whitespace-nowrap">{item.product.name}</span>
                            <span className="order-item-quantity text-ink-2 text-sm">×{item.quantity}</span>
                        </div>
                        <span className="order-item-price font-medium tabular-nums">${(item.prices.row_total?.value ?? item.prices.price.value * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
                <div className="order-total flex justify-between items-baseline pt-3.5 mt-2.5 border-t border-line text-lg font-semibold tracking-[-0.01em] tabular-nums">
                    <span>Total:</span>
                    <span>${cartData.prices.grand_total.value.toFixed(2)} {cartData.prices.grand_total.currency}</span>
                </div>
            </div>

            <button
                onClick={handlePlaceOrder}
                disabled={orderLoading}
                className={`btn-success ${CO_BTN_CLS}`}
            >
                {orderLoading && (
                    <div className={CO_SPINNER_CLS} />
                )}
                {orderLoading ? 'Processing...' : 'Place Order'}
            </button>
        </div>
    );
};

export default OrderReview;