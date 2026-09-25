import React from 'react';
import useAcceptHostedIframe from './hooks/useAcceptHostedIframe';

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
        <div className="accept-hosted-container mt-3.5">
            {error && (
                <div className="error-message p-4 mb-4 bg-[#fee] border border-[#fcc] rounded text-[#c33] text-sm leading-base">
                    {error}
                    <button type="button" onClick={retry} className="ahi-retry ml-4 px-2 py-1 bg-transparent border border-[#c33] rounded-[3px] text-[#c33] cursor-pointer text-[0.875rem]">
                        Try Again
                    </button>
                </div>
            )}

            {isLoading && (
                <div className="loading-container flex justify-center items-center min-h-[200px] text-center px-8 py-12 bg-[#f9f9f9] rounded-[8px] border border-[#eee]">
                    <div className="loading-spinner w-10 h-10 rounded-full border-4 border-[#f3f3f3] border-t-[#3498db] [animation:spin_2s_linear_infinite] mx-auto mb-4" />
                    <p className="ahi-loading-text m-0 text-[#666]">
                        {hostedPaymentParams ? 'Processing payment...' : 'Initializing secure payment form...'}
                    </p>
                    <small className="ahi-loading-sub text-[#999] block mt-2">
                        This may take a few moments
                    </small>
                </div>
            )}

            {hostedPaymentParams && formUrl && !isLoading && (
                <div className="iframe-container my-3.5">
                    <div className="security-notice mt-3.5 mb-4 p-4 bg-[#e8f4fd] border border-[#bee5eb] rounded-[8px] text-sm text-ink-2 text-center">
                        <div className="ahi-lock text-[1.5rem] mb-2">🔒</div>
                        <strong>Secure Payment Form</strong>
                        <p className="ahi-notice-text mt-2 mb-0 text-[0.875rem] text-[#0c5460]">
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
                        className="ahi-iframe border border-[#ddd] rounded-[8px] min-h-[500px] bg-bg"
                    />

                    <form
                        ref={formRef}
                        id="hosted_payment_form"
                        action={formUrl}
                        method="post"
                        target="accept_hosted_iframe"
                        className="ahi-form hidden"
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


            <div className="payment-footer mt-4 text-[0.875rem] text-[#6b7280] text-center border-t border-[#eee] pt-4">
                <p>
                    🔒 Protected by Authorize.Net • Integrated with Magento • PCI DSS Compliant
                </p>
            </div>
        </div>
    );
};

export default AcceptHostedIframe;
