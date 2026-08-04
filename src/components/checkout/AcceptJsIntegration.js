import React, { useEffect, useState } from 'react';
import '../../styles/checkout/AcceptJsIntegration.less';

const AcceptJsIntegration = ({
    cardData,
    onTokenReceived,
    onError,
    apiLoginId,
    clientKey,
    sandbox = false
}) => {
    const [acceptJsLoaded, setAcceptJsLoaded] = useState(false);
    const [isTokenizing, setIsTokenizing] = useState(false);
    const [tokenized, setTokenized] = useState(false);

    // Load Accept.js script
    useEffect(() => {
        if (window.Accept) {
            setAcceptJsLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = sandbox
            ? 'https://jstest.authorize.net/v1/Accept.js'
            : 'https://js.authorize.net/v1/Accept.js';
        script.async = true;
        script.onload = () => {
            setAcceptJsLoaded(true);
        };
        script.onerror = () => {
            onError(new Error('Failed to load Accept.js library'));
        };

        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, [onError]);

    // Auto-tokenize when Accept.js loads and card data is complete
    useEffect(() => {
        if (acceptJsLoaded && !tokenized && !isTokenizing &&
            cardData?.number && cardData?.expiry && cardData?.cvv &&
            apiLoginId && clientKey) {
            tokenizeCard();
        }
    }, [acceptJsLoaded, tokenized, isTokenizing, cardData, apiLoginId, clientKey]);

    const tokenizeCard = () => {

        if (!acceptJsLoaded || !window.Accept) {
            onError(new Error('Accept.js not loaded'));
            return;
        }

        if (!cardData.number || !cardData.expiry || !cardData.cvv) {
            onError(new Error('Please fill in all required card fields'));
            return;
        }

        setIsTokenizing(true);

        const [expMonth, expYear] = cardData.expiry.split('/');

        const authData = {
            clientKey: clientKey,
            apiLoginID: apiLoginId
        };

        const cardDataForAcceptJs = {
            cardNumber: cardData.number.replace(/\s/g, ''),
            month: expMonth,
            year: `20${expYear}`,
            cardCode: cardData.cvv
        };

        const secureData = {
            authData: authData,
            cardData: cardDataForAcceptJs
        };

        window.Accept.dispatchData(secureData, (response) => {
            setIsTokenizing(false);

            if (response.messages.resultCode === 'Error') {
                const errorMessage = response.messages.message
                    .map(msg => msg.text)
                    .join(', ');
                onError(new Error(`Accept.js Error: ${errorMessage}`));
            } else {
                // Success - return the nonce data
                setTokenized(true);
                onTokenReceived({
                    acceptjs_key: response.opaqueData.dataDescriptor,
                    acceptjs_value: response.opaqueData.dataValue
                });
            }
        });
    };

    return (
        <div className="acceptjs-integration">
            {!acceptJsLoaded && (
                <div className="acceptjs-loading">
                    <p>Loading secure payment processing...</p>
                </div>
            )}

            {acceptJsLoaded && (
                <div className="acceptjs-controls">
                    <button
                        type="button"
                        onClick={tokenizeCard}
                        disabled={isTokenizing || !cardData.number || !cardData.expiry || !cardData.cvv}
                        className="btn-secondary"
                    >
                        {isTokenizing ? 'Securing Payment Data...' : 'Secure Payment Data'}
                    </button>

                    <p className="acceptjs-info">
                        Click to securely tokenize your payment data with Authorize.Net
                    </p>
                </div>
            )}
        </div>
    );
};

export default AcceptJsIntegration;