import React from 'react';

const OrderReview = ({
    cartData,
    errors,
    handlePlaceOrder,
    orderLoading
}) => {
    return (
        <div className="form-section">
            <h2 className="form-title">Review Your Order</h2>

            <div className="order-summary-container">
                <h3 className="order-summary-title">Order Summary</h3>
                {cartData.items.map((item) => (
                    <div key={item.id} className="order-item">
                        <div className="order-item-info">
                            <span>{item.product.name}</span>
                            <span className="order-item-quantity">×{item.quantity}</span>
                        </div>
                        <span className="order-item-price">${(item.prices.price.value * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
                <div className="order-total">
                    <span>Total:</span>
                    <span>${cartData.prices.grand_total.value.toFixed(2)} {cartData.prices.grand_total.currency}</span>
                </div>
            </div>

            <button
                onClick={handlePlaceOrder}
                disabled={orderLoading}
                className="btn-success"
            >
                {orderLoading && (
                    <div className="loading-spinner" />
                )}
                {orderLoading ? 'Processing...' : 'Place Order'}
            </button>
        </div>
    );
};

export default OrderReview;