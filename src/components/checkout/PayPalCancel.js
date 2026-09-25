import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
        <div className="checkout-container max-w-container mx-auto px-gutter pt-8 pb-20 text-ink">
            <div className="error-message px-3.5 py-3 mb-4 bg-danger-bg border border-danger-border rounded text-danger text-sm leading-base">
                <h1>Payment Cancelled</h1>
                <p>Your PayPal payment was cancelled.</p>
                <p>You will be redirected back to checkout shortly...</p>

                <button
                    onClick={() => navigate('/checkout')}
                    className="btn-primary paypal-cancel__return-btn w-full h-11 py-0 gap-2.5 mt-4"
                >
                    Return to Checkout Now
                </button>

                <div className="paypal-cancel__spinner w-[18px] h-[18px] my-4 mx-auto rounded-full border-2 border-bg/40 border-t-bg animate-spin" />
            </div>
        </div>
    );
};

export default PayPalCancel;