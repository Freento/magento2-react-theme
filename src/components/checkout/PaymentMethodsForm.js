import React from 'react';
import MagentoPayPalButton from './walletIntegrations/MagentoPayPalButton';
import AuthorizeNetForm from './AuthorizeNetForm';
import BraintreeGooglePayButton from './walletIntegrations/BraintreeGooglePayButton';
import BraintreeHostedFields from './walletIntegrations/BraintreeHostedFields';

const PaymentMethodsForm = ({
    paymentMethodsData,
    errors,
    selectedPayment,
    handlePaymentMethodSelect,
    handlePaymentSubmit,
    paymentLoading,
    cardData,
    setCardData,
    loading,
    cartId,
    cartData,
    handlePayPalSuccess,
    handlePayPalError,
    handlePayPalCancel,
    onAcceptJsToken,
    tokenbaseConfig,
    onTransactionComplete,
    onTransactionError,
    guestEmail,
    onBraintreeHostedReady,
    googlePayPlaceOrder,
    googlePayMerchantId,
    googlePayEnvironment,
}) => {
    const renderIntegration = (methodCode) => {
        if (methodCode === 'paypal_express' || methodCode === 'paypal_express_bml') {
            return (
                <MagentoPayPalButton
                    cartId={cartId}
                    code={methodCode}
                    onSuccess={handlePayPalSuccess}
                    onError={handlePayPalError}
                    disabled={paymentLoading}
                />
            );
        }

        if (methodCode === 'authnetcim') {
            return (
                <AuthorizeNetForm
                    cardData={cardData}
                    setCardData={setCardData}
                    errors={errors}
                    onAcceptJsToken={onAcceptJsToken}
                    tokenbaseConfig={tokenbaseConfig}
                    cartData={cartData}
                    onTransactionComplete={onTransactionComplete}
                    onTransactionError={onTransactionError}
                    guestEmail={guestEmail}
                />
            );
        }

        if (methodCode === 'braintree_googlepay' && googlePayPlaceOrder) {
            return (
                <BraintreeGooglePayButton
                    setPaymentAndPlaceOrder={googlePayPlaceOrder}
                    googleMerchantId={googlePayMerchantId}
                    environment={googlePayEnvironment || 'TEST'}
                    totalAmount={cartData?.prices?.grand_total?.value || 0}
                    currencyCode={cartData?.prices?.grand_total?.currency || 'USD'}
                    disabled={paymentLoading}
                />
            );
        }

        if (methodCode === 'braintree') {
            return <BraintreeHostedFields onReady={onBraintreeHostedReady} />;
        }

        if (methodCode === 'braintree_cc_vault') {
            // Vault flow needs a stored-token picker (still TODO).
            return (
                <div className="card-form-container">
                    <p className="form-error">
                        Saved-card payments aren't available yet — pick "Credit Card" to enter a new card,
                        or use "Check / Money order".
                    </p>
                </div>
            );
        }

        return null;
    };

    const isOutOfBand = (code) =>
        code === 'paypal_express'
        || code === 'paypal_express_bml'
        || code === 'authnetcim'
        || code === 'braintree_googlepay';

    return (
        <div className="form-section">
            <h2 className="form-title">Payment Methods</h2>

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner" />
                </div>
            ) : paymentMethodsData?.cart?.available_payment_methods?.length > 0 ? (
                <div className="payment-methods-list">
                    {paymentMethodsData.cart.available_payment_methods.map((method) => {
                        const isSelected = selectedPayment === method.code;
                        return (
                            <React.Fragment key={method.code}>
                                <div
                                    className={`payment-method-item ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handlePaymentMethodSelect(method.code)}
                                >
                                    <div className="payment-method-content">
                                        <div className={`radio-button ${isSelected ? 'selected' : ''}`} />
                                        <h3 className="payment-method-title">{method.title}</h3>
                                    </div>
                                </div>
                                {isSelected && (
                                    <>
                                        {renderIntegration(method.code)}
                                        {!isOutOfBand(method.code) && (
                                            <button
                                                onClick={handlePaymentSubmit}
                                                disabled={paymentLoading}
                                                className="btn-primary"
                                            >
                                                {paymentLoading && <div className="loading-spinner" />}
                                                {paymentLoading ? 'Processing...' : 'Place Order'}
                                            </button>
                                        )}
                                    </>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            ) : (
                <p>No payment methods available.</p>
            )}
        </div>
    );
};

export default PaymentMethodsForm;
