import React, { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import MagentoPayPalButton from './walletIntegrations/MagentoPayPalButton';
import AuthorizeNetForm from './AuthorizeNetForm';
import BraintreeGooglePayButton from './walletIntegrations/BraintreeGooglePayButton';
import BraintreeHostedFields from './walletIntegrations/BraintreeHostedFields';
import { GET_CUSTOMER_PAYMENT_TOKENS } from '../../queries/customer';
import { cardBrand, parseTokenDetails } from '../../lib/storedCards';
import CardBrandIcon from '../ui/icons/CardBrandIcon';
import {
    FORM_SECTION_CLS,
    FORM_TITLE_CLS,
    CO_BTN_CLS,
    CO_SPINNER_CLS,
    CO_EMPTY_NOTE_CLS,
    METHOD_ITEM_CLS,
    METHOD_ITEM_ON,
    METHOD_ITEM_OFF,
    RADIO_BTN_CLS,
    RADIO_BTN_ON,
    RADIO_BTN_OFF,
} from './checkoutUi';

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
    billingBlock = null,
    placeOrderDisabled = false,
    selectedVaultHash = '',
    onVaultSelect,
    saveCard = false,
    onSaveCardChange,
    canSaveCard = false,
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
            return (
                <>
                    <BraintreeHostedFields onReady={onBraintreeHostedReady} />
                    {canSaveCard && (
                        <label className="save-card-toggle flex items-center gap-2.5 mt-3 mb-1 text-sm text-ink cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 accent-ink cursor-pointer"
                                checked={saveCard}
                                onChange={(e) => onSaveCardChange?.(e.target.checked)}
                            />
                            Save this card for later use
                        </label>
                    )}
                </>
            );
        }

        return null;
    };

    const isOutOfBand = (code) =>
        code === 'paypal_express'
        || code === 'paypal_express_bml'
        || code === 'authnetcim'
        || code === 'braintree_googlepay';

    const availableMethods = paymentMethodsData?.cart?.available_payment_methods || [];
    const vaultAvailable = availableMethods.some((m) => m.code === 'braintree_cc_vault');
    const { data: tokensData, loading: tokensLoading } = useQuery(GET_CUSTOMER_PAYMENT_TOKENS, {
        skip: !vaultAvailable || !canSaveCard,
        fetchPolicy: 'cache-and-network',
    });
    const tokensPending = vaultAvailable && canSaveCard && !tokensData && tokensLoading;
    const vaultTokens = vaultAvailable
        ? (tokensData?.customerPaymentTokens?.items || [])
            .filter((t) => t.payment_method_code === 'braintree')
        : [];
    const newMethods = availableMethods.filter((m) => m.code !== 'braintree_cc_vault');
    const vaultSelected = selectedPayment === 'braintree_cc_vault';

    useEffect(() => {
        if (!vaultSelected || !vaultTokens.length) return;
        if (!vaultTokens.some((t) => t.public_hash === selectedVaultHash)) {
            onVaultSelect?.(vaultTokens[0].public_hash);
        }
    }, [vaultSelected, vaultTokens, selectedVaultHash, onVaultSelect]);

    const selectedBlock = (methodCode) => (
        <div className="payment-method-body mt-4 pt-4 border-t border-line cursor-default" onClick={(e) => e.stopPropagation()}>
            {billingBlock}
            {renderIntegration(methodCode)}
            {!isOutOfBand(methodCode) && (
                <button
                    onClick={handlePaymentSubmit}
                    disabled={paymentLoading || placeOrderDisabled}
                    className={`btn-primary ${CO_BTN_CLS}`}
                >
                    {paymentLoading && <div className={CO_SPINNER_CLS} />}
                    {paymentLoading ? 'Processing...' : 'Place Order'}
                </button>
            )}
        </div>
    );

    return (
        <div className={FORM_SECTION_CLS}>
            <h2 className={FORM_TITLE_CLS}>Payment Methods</h2>

            {loading || tokensPending ? (
                <div className="payment-methods-list grid gap-2 mb-2" aria-busy="true" aria-live="polite">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={`sk-${i}`} className="payment-method-item is-skel block border border-line rounded px-5 py-[18px] bg-bg cursor-default pointer-events-none" aria-hidden="true">
                            <div className="payment-method-content flex items-center gap-5">
                                <span className="skeleton co-skel-radio w-[18px] h-[18px] rounded-full shrink-0" />
                                <div className="co-skel-method-text flex flex-col gap-1.5 flex-1 min-w-0">
                                    <span className="skeleton co-skel-method-title w-3/5 h-3.5" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : availableMethods.length > 0 ? (
                <div className="payment-methods-list grid gap-2 mb-2">
                    {vaultTokens.map((token) => {
                        const details = parseTokenDetails(token.details);
                        const isSelected = vaultSelected && selectedVaultHash === token.public_hash;
                        return (
                            <React.Fragment key={token.public_hash}>
                                <div
                                    className={`payment-method-item ${METHOD_ITEM_CLS} ${isSelected ? METHOD_ITEM_ON : METHOD_ITEM_OFF}`}
                                    onClick={() => {
                                        handlePaymentMethodSelect('braintree_cc_vault');
                                        onVaultSelect?.(token.public_hash);
                                    }}
                                >
                                    <div className="payment-method-content flex items-center gap-5">
                                        <div className={`${RADIO_BTN_CLS} ${isSelected ? RADIO_BTN_ON : RADIO_BTN_OFF}`} />
                                        <CardBrandIcon type={details.type} className="shrink-0" />
                                        <h3 className="payment-method-title mb-0.5 font-sans text-base font-medium tracking-[-0.005em] text-ink leading-[1.35]">
                                            {cardBrand(details)}
                                            {details.maskedCC && ` ending ${details.maskedCC}`}
                                            {details.expirationDate && ` (expires: ${details.expirationDate})`}
                                        </h3>
                                    </div>
                                    {isSelected && selectedBlock('braintree_cc_vault')}
                                </div>
                            </React.Fragment>
                        );
                    })}
                    {vaultTokens.length > 0 && (
                        <h3 className="payment-methods-group-title mt-4 mb-1 text-sm font-medium tracking-[0.04em] uppercase text-ink-2">Select a new payment method</h3>
                    )}
                    {newMethods.map((method) => {
                        const isSelected = selectedPayment === method.code;
                        return (
                            <React.Fragment key={method.code}>
                                <div
                                    className={`payment-method-item ${METHOD_ITEM_CLS} ${isSelected ? METHOD_ITEM_ON : METHOD_ITEM_OFF}`}
                                    onClick={() => handlePaymentMethodSelect(method.code)}
                                >
                                    <div className="payment-method-content flex items-center gap-5">
                                        <div className={`${RADIO_BTN_CLS} ${isSelected ? RADIO_BTN_ON : RADIO_BTN_OFF}`} />
                                        <h3 className="payment-method-title mb-0.5 font-sans text-base font-medium tracking-[-0.005em] text-ink leading-[1.35]">{method.title}</h3>
                                    </div>
                                    {isSelected && selectedBlock(method.code)}
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            ) : (
                <p className={CO_EMPTY_NOTE_CLS}>No payment methods available.</p>
            )}
        </div>
    );
};

export default PaymentMethodsForm;
