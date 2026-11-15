import React, { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import MagentoPayPalButton from './walletIntegrations/MagentoPayPalButton';
import AuthorizeNetForm from './AuthorizeNetForm';
import BraintreeGooglePayButton from './walletIntegrations/BraintreeGooglePayButton';
import BraintreeHostedFields from './walletIntegrations/BraintreeHostedFields';
import BraintreePayPalButton from './walletIntegrations/BraintreePayPalButton';
import SaveForLaterCheckbox from './SaveForLaterCheckbox';
import { GET_CUSTOMER_PAYMENT_TOKENS, GET_PAYPAL_BILLING_AGREEMENTS, GET_TOKENBASE_CARDS } from '../../queries/customer';
import { AUTHNETCIM_STORED_CODE, BILLING_AGREEMENT_CODE, isStoredCode, isVaultCode, tokenbaseCardLabel, tokenLabel, vaultCodeOf } from '../../lib/storedCards';
import CardBrandIcon from '../ui/icons/CardBrandIcon';
import PaymentTokenIcon from '../ui/icons/PaymentTokenIcon';
import PayPalLogoIcon from '../ui/icons/PayPalLogoIcon';
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
    tokenbaseConfig,
    onTransactionComplete,
    onTransactionError,
    guestEmail,
    onBraintreeHostedReady,
    googlePayPlaceOrder,
    paypalPlaceOrder,
    braintreeConfig = null,
    googlePayMerchantId,
    googlePayEnvironment,
    billingBlock = null,
    placeOrderDisabled = false,
    selectedVaultHash = '',
    onVaultSelect,
    saveCard = false,
    onSaveCardChange,
    canSaveCard = false,
    billingAgreementSignup = 'never',
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
                    showBillingAgreement={canSaveCard && billingAgreementSignup === 'ask' && !hasMethod(BILLING_AGREEMENT_CODE)}
                />
            );
        }

        if (methodCode === 'authnetcim') {
            return (
                <AuthorizeNetForm
                    cardData={cardData}
                    setCardData={setCardData}
                    errors={errors}
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
                    showSaveForLater={canSaveCard && hasMethod('braintree_googlepay_vault')}
                />
            );
        }

        if (methodCode === 'braintree_paypal' && paypalPlaceOrder) {
            return (
                <BraintreePayPalButton
                    setPaymentAndPlaceOrder={paypalPlaceOrder}
                    totalAmount={cartData?.prices?.grand_total?.value || 0}
                    currencyCode={cartData?.prices?.grand_total?.currency || 'USD'}
                    shippingAddress={cartData?.shipping_addresses?.[0] || null}
                    environment={braintreeConfig?.environment}
                    merchantCountry={braintreeConfig?.paypalMerchantCountry}
                    buttonStyle={braintreeConfig?.paypalButtonStyle}
                    disabled={paymentLoading}
                    showSaveForLater={canSaveCard && hasMethod('braintree_paypal_vault')}
                />
            );
        }

        if (methodCode === 'braintree') {
            return (
                <>
                    <BraintreeHostedFields onReady={onBraintreeHostedReady} />
                    {canSaveCard && hasMethod('braintree_cc_vault') && (
                        <SaveForLaterCheckbox
                            className="mt-3 mb-1"
                            label="Save this card for later use"
                            checked={saveCard}
                            onChange={onSaveCardChange}
                        />
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
        || code === 'braintree_googlepay'
        || code === 'braintree_paypal';

    const availableMethods = paymentMethodsData?.cart?.available_payment_methods || [];
    const availableCodes = new Set(availableMethods.map((m) => m.code));
    const hasMethod = (code) => availableCodes.has(code);
    const vaultAvailable = availableMethods.some((m) => isVaultCode(m.code));
    const { data: tokensData, loading: tokensLoading } = useQuery(GET_CUSTOMER_PAYMENT_TOKENS, {
        skip: !vaultAvailable || !canSaveCard,
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
    });
    const agreementsAvailable = hasMethod(BILLING_AGREEMENT_CODE);
    const { data: agreementsData, loading: agreementsLoading } = useQuery(GET_PAYPAL_BILLING_AGREEMENTS, {
        skip: !agreementsAvailable || !canSaveCard,
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'ignore',
    });
    const cimAvailable = hasMethod('authnetcim');
    const { data: cimData, loading: cimLoading } = useQuery(GET_TOKENBASE_CARDS, {
        skip: !cimAvailable || !canSaveCard,
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'ignore',
    });
    const tokensPending = (vaultAvailable && canSaveCard && !tokensData && tokensLoading)
        || (agreementsAvailable && canSaveCard && !agreementsData && agreementsLoading)
        || (cimAvailable && canSaveCard && !cimData && cimLoading);
    const cimCards = cimAvailable
        ? (cimData?.tokenBaseCards || []).filter((card) => card.active && card.method === 'authnetcim' && card.hash)
        : [];
    const vaultTokens = vaultAvailable
        ? (tokensData?.customerPaymentTokens?.items || [])
            .filter((t) => t?.public_hash && availableCodes.has(vaultCodeOf(t)))
        : [];
    const agreements = agreementsAvailable ? (agreementsData?.customerPaypalBillingAgreements || []) : [];
    const storedItems = [
        ...vaultTokens.map((token) => ({
            key: token.public_hash,
            code: vaultCodeOf(token),
            label: tokenLabel(token),
            source: token.payment_method_code === 'braintree_googlepay' ? 'Google Pay' : token.payment_method_code === 'braintree_paypal' ? 'PayPal' : 'Braintree',
            icon: <PaymentTokenIcon token={token} className="shrink-0" />,
        })),
        ...cimCards.map((card) => ({
            key: card.hash,
            code: AUTHNETCIM_STORED_CODE,
            label: tokenbaseCardLabel(card),
            source: 'Authorize.Net',
            icon: <CardBrandIcon type={card.additional?.cc_type} className="shrink-0" />,
        })),
        ...agreements.map((agreement) => ({
            key: String(agreement.id),
            code: BILLING_AGREEMENT_CODE,
            label: `PayPal billing agreement ${agreement.reference_id || ''}`.trim(),
            source: 'PayPal',
            icon: <PayPalLogoIcon className="shrink-0" />,
        })),
    ];
    const newMethods = availableMethods.filter((m) => !isStoredCode(m.code));
    const storedSelected = isStoredCode(selectedPayment);

    useEffect(() => {
        if (!storedSelected) return;
        const ofMethod = storedItems.filter((item) => item.code === selectedPayment);
        if (!ofMethod.length) return;
        if (!ofMethod.some((item) => item.key === selectedVaultHash)) {
            onVaultSelect?.(ofMethod[0].key);
        }
    }, [storedSelected, storedItems, selectedPayment, selectedVaultHash, onVaultSelect]);

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
                    {storedItems.map((item) => {
                        const isSelected = selectedPayment === item.code && selectedVaultHash === item.key;
                        return (
                            <React.Fragment key={`${item.code}:${item.key}`}>
                                <div
                                    className={`payment-method-item ${METHOD_ITEM_CLS} ${isSelected ? METHOD_ITEM_ON : METHOD_ITEM_OFF}`}
                                    onClick={() => {
                                        handlePaymentMethodSelect(item.code);
                                        onVaultSelect?.(item.key);
                                    }}
                                >
                                    <div className="payment-method-content flex items-center gap-5">
                                        <div className={`${RADIO_BTN_CLS} ${isSelected ? RADIO_BTN_ON : RADIO_BTN_OFF}`} />
                                        {item.icon}
                                        <div className="min-w-0">
                                            <h3 className="payment-method-title mb-0.5 font-sans text-base font-medium tracking-[-0.005em] text-ink leading-[1.35] [overflow-wrap:anywhere]">
                                                {item.label}
                                            </h3>
                                            <p className="payment-method-source m-0 text-xs text-ink-2">{item.source}</p>
                                        </div>
                                    </div>
                                    {isSelected && selectedBlock(item.code)}
                                </div>
                            </React.Fragment>
                        );
                    })}
                    {storedItems.length > 0 && (
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
