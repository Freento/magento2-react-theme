import React, { useState, useEffect, useRef } from 'react';

const AcceptHostedForm = ({
    tokenbaseConfig,
    onTokenReceived,
    onError,
    onCancel
}) => {
    const [loading, setLoading] = useState(true);
    const [formUrl, setFormUrl] = useState(null);
    const iframeRef = useRef(null);

    const apiLoginId = tokenbaseConfig?.apiLoginId || process.env.REACT_APP_AUTHNET_API_LOGIN_ID;
    const clientKey = tokenbaseConfig?.clientKey || process.env.REACT_APP_AUTHNET_CLIENT_KEY;
    const sandbox = tokenbaseConfig?.sandbox || process.env.REACT_APP_AUTHNET_SANDBOX === 'true';

    useEffect(() => {
        const generateFormUrl = () => {
            if (!apiLoginId || !clientKey) {
                onError?.(new Error('Missing Authorize.Net credentials'));
                setLoading(false);
                return;
            }

            const baseUrl = sandbox
                ? 'https://test.authorize.net/payment/payment'
                : 'https://accept.authorize.net/payment/payment';

            const params = new URLSearchParams({
                'x_login': apiLoginId,
                'x_amount': '0.01', // Minimal amount for form display
                'x_show_form': 'PAYMENT_FORM',
                'x_type': 'AUTH_ONLY',
                'x_method': 'CC',
                'x_relay_response': 'FALSE'
            });

            const url = `${baseUrl}?${params.toString()}`;
            setFormUrl(url);
            setLoading(false);
        };

        generateFormUrl();
    }, [apiLoginId, clientKey, sandbox, onError]);

    useEffect(() => {
        const handleMessage = (event) => {
            const allowedOrigins = [
                'https://test.authorize.net',
                'https://accept.authorize.net'
            ];

            if (!allowedOrigins.includes(event.origin)) {
                return;
            }

            try {
                const data = JSON.parse(event.data);

                if (data.action === 'successfulSave' && data.details?.opaqueData) {
                    const tokenData = {
                        opaqueDataDescriptor: data.details.opaqueData.dataDescriptor,
                        opaqueDataValue: data.details.opaqueData.dataValue
                    };
                    onTokenReceived?.(tokenData);
                } else if (data.action === 'cancel') {
                    onCancel?.();
                } else if (data.action === 'transactResponse') {
                    if (data.response?.responseCode === '1') {
                        // Transaction approved
                        onTokenReceived?.({
                            transactionId: data.response.transId,
                            authCode: data.response.authCode
                        });
                    } else {
                        onError?.(new Error(data.response?.errors?.[0]?.errorText || 'Payment failed'));
                    }
                }
            } catch (error) {
                onError?.(new Error('Error parsing payment response'));
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onTokenReceived, onError, onCancel]);

    if (loading) {
        return (
            <div className="accept-hosted-loading">
                <div className="loading-spinner w-[18px] h-[18px] rounded-full border-2 border-bg/40 border-t-bg animate-spin"></div>
                <p>Loading secure payment form...</p>
            </div>
        );
    }

    return (
        <div className="accept-hosted-container mt-3.5">
            <div className="accept-hosted-iframe-wrapper">
                <iframe
                    ref={iframeRef}
                    src={formUrl}
                    width="100%"
                    height="500"
                    frameBorder="0"
                    title="Authorize.Net Secure Payment Form"
                    allow="payment"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-top-navigation"
                />
            </div>

            <div className="accept-hosted-info">
                <p>🔒 Your payment information is processed securely by Authorize.Net</p>
                <p>Your card details are never stored on our servers</p>
            </div>
        </div>
    );
};

export default AcceptHostedForm;