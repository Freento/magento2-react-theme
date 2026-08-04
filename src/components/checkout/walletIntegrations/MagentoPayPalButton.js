import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_PAYPAL_EXPRESS_TOKEN } from '../../../queries/checkout';
import '../../../styles/checkout/walletIntegrations/MagentoPayPalButton.less';

const MagentoPayPalButton = ({
    cartId,
    code = 'paypal_express',
    onSuccess,
    onError,
    disabled = false
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [createPayPalToken] = useMutation(CREATE_PAYPAL_EXPRESS_TOKEN);

    const handlePayPalClick = async () => {
        if (disabled) return;

        setIsLoading(true);

        try {
            const useCredit = code === 'paypal_express_bml';
            const result = await createPayPalToken({
                variables: {
                    cartId,
                    code: 'paypal_express',
                    express_button: true,
                    use_paypal_credit: useCredit,
                    urls: {
                        return_url: `${window.location.origin}/paypal/return`,
                        cancel_url: `${window.location.origin}/paypal/cancel`
                    }
                }
            });

            const { token, paypal_urls } = result.data.createPaypalExpressToken;

            if (token && paypal_urls?.start) {
                window.location.href = paypal_urls.start;
            } else {
                throw new Error('Failed to create PayPal token');
            }
        } catch (error) {
            console.error('PayPal token creation error:', error);
            setIsLoading(false);

            const errorMessage = error.graphQLErrors?.[0]?.message ||
                error.message ||
                'Failed to initiate PayPal payment';

            onError(new Error(errorMessage));
        }
    };

    return (
        <div className="magento-paypal-container">
            <button
                className="magento-paypal-button magento-paypal-button-static"
                onClick={handlePayPalClick}
                disabled={disabled || isLoading}
                style={{
                    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
                    opacity: disabled || isLoading ? '0.6' : '1'
                }}
                onMouseEnter={(e) => {
                    if (!disabled && !isLoading) {
                        e.target.style.backgroundColor = '#005ea6';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!disabled && !isLoading) {
                        e.target.style.backgroundColor = '#0070ba';
                    }
                }}
            >
                {isLoading && (
                    <div className="magento-paypal-spinner" />
                )}
                <span>
          {isLoading
              ? 'Redirecting to PayPal...'
              : code === 'paypal_express_bml' ? 'Pay with PayPal Credit' : 'Pay with PayPal'}
        </span>
            </button>

            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default MagentoPayPalButton;