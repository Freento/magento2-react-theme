import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { SET_PAYMENT_METHOD_AND_PLACE_ORDER } from '../../queries/checkout';
import { useCart } from '../../context/CartContext';
import '../../styles/checkout/Checkout.less';

const PayPalReturn = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { cartId, clearCart } = useCart();
    const [error, setError] = useState(null);
    const processedRef = useRef(false);

    const [setPaymentAndPlaceOrder] = useMutation(SET_PAYMENT_METHOD_AND_PLACE_ORDER);

    useEffect(() => {
        if (processedRef.current) return;

        const token = searchParams.get('token');
        const payerId = searchParams.get('PayerID');
        const activeCartId = cartId || (typeof localStorage !== 'undefined' ? localStorage.getItem('cartId') : null);

        if (!token || !payerId || !activeCartId) {
            setError('Missing PayPal parameters or active cart. Return to checkout to try again.');
            return;
        }

        processedRef.current = true;

        (async () => {
            try {
                if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('paypalReturnCode');

                const result = await setPaymentAndPlaceOrder({
                    variables: {
                        cartId: activeCartId,
                        paymentMethod: {
                            code: 'paypal_express',
                            paypal_express: { payer_id: payerId, token },
                        },
                    },
                });

                const orderNumber = result.data?.placeOrder?.order?.order_number;
                if (!orderNumber) {
                    console.error('[paypal-return] placeOrder returned no order:', result);
                    throw new Error('Order was not created. Please try a different payment method.');
                }
                await clearCart();
                navigate('/checkout/success', { state: { orderNumber }, replace: true });
            } catch (err) {
                console.error('PayPal return processing error:', err);
                processedRef.current = false;
                setError(
                    err.graphQLErrors?.[0]?.message
                    || err.message
                    || 'Failed to process PayPal payment'
                );
            }
        })();
    }, [searchParams, cartId, clearCart, navigate, setPaymentAndPlaceOrder]);

    return (
        <div className="paypal-return">
            <div className="paypal-return-card">
                {error ? (
                    <>
                        <div className="paypal-return-icon paypal-return-icon--error" aria-hidden="true">!</div>
                        <h1 className="paypal-return-title">Payment processing error</h1>
                        <p className="paypal-return-text">{error}</p>
                        <button
                            type="button"
                            className="btn-primary paypal-return-action"
                            onClick={() => navigate('/checkout')}
                        >
                            Return to Checkout
                        </button>
                    </>
                ) : (
                    <>
                        <div className="loading-spinner paypal-return-spinner" aria-hidden="true" />
                        <h1 className="paypal-return-title">Processing your PayPal payment</h1>
                        <p className="paypal-return-text">Hold tight — we’re finalising your order with PayPal.</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default PayPalReturn;
