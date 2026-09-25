import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const CheckoutSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const orderNumber = location.state?.orderNumber;

    useEffect(() => {
        if (!orderNumber) navigate('/', { replace: true });
    }, [orderNumber, navigate]);

    if (!orderNumber) return null;

    const actionBtnCls = 'w-auto m-0 h-[52px] min641:h-11 gap-2.5 py-0 px-[22px]';

    return (
        <div className="checkout-container max-w-container mx-auto px-gutter pt-8 pb-20 text-ink">
            <div className="order-success-message max-w-[560px] mt-[60px] mx-auto px-12 py-14 bg-bg border border-line rounded text-center">
                <div className="success-icon w-14 h-14 mx-auto mb-[18px] rounded-full bg-ink text-bg inline-flex items-center justify-center text-[24px] leading-none" aria-hidden="true">✓</div>

                <h1 className="mb-3.5 font-sans text-[26px] font-semibold tracking-[-0.015em] text-ink leading-[1.25]">Order Placed Successfully!</h1>
                <p className="order-number max-w-[420px] my-[18px] text-base leading-relaxed text-ink">
                    Your order number is: <strong className="tabular-nums tracking-[0.02em]">#{orderNumber}</strong>
                </p>
                <p className="mx-auto mb-2.5 max-w-[420px] text-base leading-relaxed text-ink-2">You will receive a confirmation email shortly.</p>

                <div className="success-actions flex flex-col min641:flex-row min641:justify-center gap-2.5 mt-7 items-stretch">
                    <button
                        onClick={() => navigate('/')}
                        className={`btn-primary ${actionBtnCls}`}
                    >
                        Continue Shopping
                    </button>

                    <button
                        onClick={() => navigate('/my-account', { state: { activeTab: 'orders' } })}
                        className={`btn-secondary ${actionBtnCls}`}
                    >
                        View My Orders
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckoutSuccess;
