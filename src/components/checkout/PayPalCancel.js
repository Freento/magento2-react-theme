import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/checkout/PayPalCancel.less';

const PayPalCancel = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/checkout', {
                state: {
                    error: 'PayPal payment was cancelled. Please try again or select a different payment method.'
                }
            });
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="checkout-container">
            <div className="error-message">
                <h1>Payment Cancelled</h1>
                <p>Your PayPal payment was cancelled.</p>
                <p>You will be redirected back to checkout shortly...</p>

                <button
                    onClick={() => navigate('/checkout')}
                    className="btn-primary paypal-cancel__return-btn"
                >
                    Return to Checkout Now
                </button>

                <div className="loading-spinner paypal-cancel__spinner" />
            </div>
        </div>
    );
};

export default PayPalCancel;