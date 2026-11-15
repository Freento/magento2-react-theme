import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CANCEL_PAYPAL_BILLING_AGREEMENT, DELETE_PAYMENT_TOKEN, DELETE_TOKENBASE_CARD } from '../../../queries/customer';
import { CARD_TYPES, cardBrand, isAccountToken, parseTokenDetails } from '../../../lib/storedCards';
import PaymentTokenIcon from '../../ui/icons/PaymentTokenIcon';
import CardBrandIcon from '../../ui/icons/CardBrandIcon';
import PayPalLogoIcon from '../../ui/icons/PayPalLogoIcon';

// The tokens query lives in MyAccount: this component unmounts whenever another
// tab is shown, and owning the query here refetched it on every visit.
const tokenSource = (token) => {
  if (token.payment_method_code === 'braintree_googlepay') return 'Google Pay';
  if (isAccountToken(token)) return 'PayPal';
  return 'Braintree';
};

const vaultRow = (token) => {
  const details = parseTokenDetails(token.details);
  const account = isAccountToken(token);
  return {
    key: `vault:${token.public_hash}`,
    icon: <PaymentTokenIcon token={token} className="shrink-0" />,
    title: account ? 'PayPal' : cardBrand(details),
    detail: account ? details.payerEmail : details.maskedCC && `ending in ${details.maskedCC}`,
    expires: account ? null : details.expirationDate,
    source: tokenSource(token),
    action: 'Delete',
    kind: 'vault',
    id: token.public_hash,
  };
};

const cimRow = (card) => {
  const info = card.additional || {};
  return {
    key: `cim:${card.hash}`,
    icon: <CardBrandIcon type={info.cc_type} className="shrink-0" />,
    title: CARD_TYPES[info.cc_type] || info.cc_type || 'Card',
    detail: info.cc_last4 && `ending in ${info.cc_last4}`,
    expires: info.cc_exp_month && info.cc_exp_year ? `${String(info.cc_exp_month).padStart(2, '0')}/${info.cc_exp_year}` : null,
    source: 'Authorize.Net',
    action: 'Delete',
    kind: 'cim',
    id: card.hash,
  };
};

const agreementRow = (agreement) => ({
  key: `ba:${agreement.id}`,
  icon: <PayPalLogoIcon className="shrink-0" />,
  title: 'PayPal billing agreement',
  detail: agreement.reference_id,
  expires: null,
  source: 'PayPal',
  action: 'Cancel',
  kind: 'agreement',
  id: agreement.id,
});

const CONFIRM = {
  vault: 'Are you sure you want to delete this payment method?',
  cim: 'Are you sure you want to delete this payment method?',
  agreement: 'Are you sure you want to cancel this billing agreement?',
};

const DONE = {
  vault: 'Stored payment method was deleted.',
  cim: 'Stored payment method was deleted.',
  agreement: 'Billing agreement was canceled.',
};

const StoredPaymentsTab = ({ tokensQuery, cimQuery = {}, agreementsQuery = {}, onSuccess, onError }) => {
  const { data, loading, error } = tokensQuery;
  const [deleteToken] = useMutation(DELETE_PAYMENT_TOKEN);
  const [deleteCimCard] = useMutation(DELETE_TOKENBASE_CARD);
  const [cancelAgreement] = useMutation(CANCEL_PAYPAL_BILLING_AGREEMENT);
  const [busyKey, setBusyKey] = useState(null);

  const rows = [
    ...(data?.customerPaymentTokens?.items || []).filter((token) => token?.public_hash && token.type).map(vaultRow),
    ...(cimQuery.data?.tokenBaseCards || []).filter((card) => card?.active && card.hash).map(cimRow),
    ...(agreementsQuery.data?.customerPaypalBillingAgreements || []).map(agreementRow),
  ];
  const anyLoading = (loading && !data) || (cimQuery.loading && !cimQuery.data) || (agreementsQuery.loading && !agreementsQuery.data);

  const handleAction = async (row) => {
    if (!window.confirm(CONFIRM[row.kind])) return;
    setBusyKey(row.key);
    try {
      if (row.kind === 'vault') {
        await deleteToken({ variables: { hash: row.id } });
        await tokensQuery.refetch?.();
      } else if (row.kind === 'cim') {
        await deleteCimCard({ variables: { hash: row.id } });
        await cimQuery.refetch?.();
        await tokensQuery.refetch?.();
      } else {
        await cancelAgreement({ variables: { id: row.id } });
        await agreementsQuery.refetch?.();
      }
      onSuccess(DONE[row.kind]);
    } catch (err) {
      onError(err?.graphQLErrors?.[0]?.message || err?.message || 'Could not update the payment method. Please try again.');
    } finally {
      setBusyKey(null);
    }
  };

  if (anyLoading && !rows.length) {
    return (
      <div className="account-section pointer-events-none" aria-busy="true" aria-live="polite">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={`pm-${i}`} className="flex items-center justify-between gap-4 px-[18px] py-4 border border-line rounded bg-bg max768:flex-col max768:items-stretch" aria-hidden="true">
              <div className="flex items-center flex-wrap gap-y-1.5 gap-x-3.5 min-w-0">
                <span className="skeleton w-9 h-6 shrink-0" />
                <span className="skeleton w-[30px] h-3.5" />
                <span className="skeleton w-[88px] h-3.5" />
                <span className="skeleton w-[94px] h-3" />
              </div>
              <span className="skeleton w-[79px] h-11 shrink-0 max768:w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !data && !rows.length) {
    return (
      <div className="account-section">
        <div className="empty-state"><p>Could not load stored payment methods: {error.message}</p></div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="account-section">
        <div className="empty-state"><p>You have no stored payment methods.</p></div>
      </div>
    );
  }

  return (
    <div className="account-section">
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4 px-[18px] py-4 border border-line rounded bg-bg max768:flex-col max768:items-stretch">
            <div className="flex items-center flex-wrap gap-y-1.5 gap-x-3.5 min-w-0">
              {row.icon}
              <span className="font-semibold text-ink">{row.title}</span>
              {row.detail && <span className="text-ink [overflow-wrap:anywhere]">{row.detail}</span>}
              {row.expires && <span className="text-ink-2 text-sm">Expires {row.expires}</span>}
              <span className="text-ink-2 text-sm">{row.source}</span>
            </div>
            <button
              type="button"
              className="btn-danger flex-none w-auto m-0 px-[18px] py-[9px] max768:w-full"
              disabled={busyKey === row.key}
              onClick={() => handleAction(row)}
            >
              {busyKey === row.key ? `${row.action === 'Cancel' ? 'Canceling' : 'Deleting'}…` : row.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoredPaymentsTab;
