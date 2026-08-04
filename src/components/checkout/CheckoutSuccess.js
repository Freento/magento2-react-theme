import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../styles/checkout/Checkout.less';

const CheckoutSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const orderNumber = location.state?.orderNumber;

    useEffect(() => {
        if (!orderNumber) navigate('/', { replace: true });
    }, [orderNumber, navigate]);

    if (!orderNumber) return null;

    return (
        <div className="checkout-container">
            <div className="order-success-message">
                <div className="success-icon" aria-hidden="true">✓</div>

                <h1>Order Placed Successfully!</h1>
                <p className="order-number">
                    Your order number is: <strong>#{orderNumber}</strong>
                </p>
                <p>You will receive a confirmation email shortly.</p>

                <div className="success-actions">
                    <button
                        onClick={() => navigate('/')}
                        className="btn-primary"
                    >
                        Continue Shopping
                    </button>

                    <button
                        onClick={() => navigate('/my-account', { state: { activeTab: 'orders' } })}
                        className="btn-secondary"
                    >
                        View My Orders
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckoutSuccess;