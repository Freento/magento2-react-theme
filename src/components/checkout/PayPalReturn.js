import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { SET_PAYMENT_METHOD_AND_PLACE_ORDER } from '../../queries/checkout';
import { useCart } from '../../context/CartContext';

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

    const titleCls = 'paypal-return-title font-sans text-xl font-semibold tracking-[-0.01em] leading-[1.2] mb-3';
    const textCls = 'paypal-return-text text-base leading-[1.6] text-ink-2';

    return (
        <div className="paypal-return min-h-[calc(100vh-200px)] max600:min-h-[calc(100vh-140px)] flex items-center justify-center px-gutter py-10 max600:px-4 max600:py-6">
            <div className="paypal-return-card w-full max-w-[480px] px-10 py-12 max600:px-6 max600:py-8 bg-bg border border-line rounded text-center text-ink">
                {error ? (
                    <>
                        <div className="paypal-return-icon w-14 h-14 mx-auto mb-5 rounded-full flex items-center justify-center font-sans text-[28px] font-semibold leading-none bg-danger-bg text-danger border border-danger-border" aria-hidden="true">!</div>
                        <h1 className={titleCls}>Payment processing error</h1>
                        <p className={textCls}>{error}</p>
                        <button
                            type="button"
                            className="btn-primary paypal-return-action w-full h-11 py-0 gap-2.5 mt-7 min-w-[200px]"
                            onClick={() => navigate('/checkout')}
                        >
                            Return to Checkout
                        </button>
                    </>
                ) : (
                    <>
                        <div className="paypal-return-spinner w-10 h-10 mx-auto mb-6 rounded-full border-2 border-line border-t-ink animate-spin" aria-hidden="true" />
                        <h1 className={titleCls}>Processing your PayPal payment</h1>
                        <p className={textCls}>Hold tight — we’re finalising your order with PayPal.</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default PayPalReturn;
