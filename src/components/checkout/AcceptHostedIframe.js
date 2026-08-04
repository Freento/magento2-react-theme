import React from 'react';
import useAcceptHostedIframe from './hooks/useAcceptHostedIframe';
import '../../styles/checkout/AcceptHostedIframe.less';

// Authorize.Net hosted-payment iframe. All logic (param fetch, postMessage
// bridge, transaction handling) lives in useAcceptHostedIframe; this file
// just renders the iframe + its loading/error states.
const AcceptHostedIframe = (props) => {
    const { isVisible = false } = props;
    const {
        error,
        isLoading,
        hostedPaymentParams,
        formUrl,
        iframeHeight,
        iframeRef,
        formRef,
        retry,
    } = useAcceptHostedIframe(props);

    if (!isVisible) {
        return null;
    }

    return (
        <div className="accept-hosted-container">
            {error && (
                <div className="error-message">
                    {error}
                    <button type="button" onClick={retry} className="ahi-retry">
                        Try Again
                    </button>
                </div>
            )}

            {isLoading && (
                <div className="loading-container">
                    <div className="loading-spinner" />
                    <p className="ahi-loading-text">
                        {hostedPaymentParams ? 'Processing payment...' : 'Initializing secure payment form...'}
                    </p>
                    <small className="ahi-loading-sub">
                        This may take a few moments
                    </small>
                </div>
            )}

            {hostedPaymentParams && formUrl && !isLoading && (
                <div className="iframe-container">
                    <div className="security-notice">
                        <div className="ahi-lock">🔒</div>
                        <strong>Secure Payment Form</strong>
                        <p className="ahi-notice-text">
                            This payment form is hosted and secured by Authorize.Net with 256-bit SSL encryption.
                            Your payment information is processed securely through Magento and never stored on our servers.
                        </p>
                    </div>

                    <iframe
                        ref={iframeRef}
                        id="accept_hosted_iframe"
                        name="accept_hosted_iframe"
                        width="100%"
                        height={`${iframeHeight}px`}
                        frameBorder="0"
                        scrolling="no"
                        title="Authorize.Net Secure Payment Form"
                        className="ahi-iframe"
                    />

                    <form
                        ref={formRef}
                        id="hosted_payment_form"
                        action={formUrl}
                        method="post"
                        target="accept_hosted_iframe"
                        className="ahi-form"
                    >
                        {hostedPaymentParams && Object.entries(hostedPaymentParams).map(([key, value]) => (
                            <input
                                key={key}
                                type="hidden"
                                name={key}
                                value={value}
                            />
                        ))}
                    </form>
                </div>
            )}


            <div className="payment-footer">
                <p>
                    🔒 Protected by Authorize.Net • Integrated with Magento • PCI DSS Compliant
                </p>
            </div>
        </div>
    );
};

export default AcceptHostedIframe;
