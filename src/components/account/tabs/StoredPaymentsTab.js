import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { GET_CUSTOMER_PAYMENT_TOKENS, DELETE_PAYMENT_TOKEN } from '../../../queries/customer';
import { cardBrand, parseTokenDetails } from '../../../lib/storedCards';
import CardBrandIcon from '../../ui/icons/CardBrandIcon';

const StoredPaymentsTab = ({ onSuccess, onError }) => {
  const { data, loading, error, refetch } = useQuery(GET_CUSTOMER_PAYMENT_TOKENS);
  const [deleteToken] = useMutation(DELETE_PAYMENT_TOKEN);
  const [deletingHash, setDeletingHash] = useState(null);

  const tokens = data?.customerPaymentTokens?.items || [];

  const handleDelete = async (token) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) return;
    setDeletingHash(token.public_hash);
    try {
      await deleteToken({ variables: { hash: token.public_hash } });
      await refetch();
      onSuccess('Stored payment method was deleted.');
    } catch (err) {
      onError(err?.graphQLErrors?.[0]?.message || err?.message || 'Could not delete the payment method — please try again.');
    } finally {
      setDeletingHash(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="account-section pointer-events-none" aria-busy="true" aria-live="polite">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={`pm-${i}`} className="flex items-center justify-between gap-4 px-[18px] py-4 border border-line rounded bg-bg max768:flex-col max768:items-stretch" aria-hidden="true">
            <span className="skeleton w-full h-3" />
          </div>
        ))}
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="account-section">
        <div className="empty-state"><p>Could not load stored payment methods: {error.message}</p></div>
      </div>
    );
  }

  if (!tokens.length) {
    return (
      <div className="account-section">
        <div className="empty-state"><p>You have no stored payment methods.</p></div>
      </div>
    );
  }

  return (
    <div className="account-section">
      <div className="flex flex-col gap-3">
        {tokens.map((token) => {
          const details = parseTokenDetails(token.details);
          const brand = cardBrand(details);
          return (
            <div key={token.public_hash} className="flex items-center justify-between gap-4 px-[18px] py-4 border border-line rounded bg-bg max768:flex-col max768:items-stretch">
              <div className="flex items-center flex-wrap gap-y-1.5 gap-x-3.5 min-w-0">
                <CardBrandIcon type={details.type} className="shrink-0" />
                <span className="font-semibold text-ink">{brand}</span>
                {details.maskedCC && <span className="text-ink">ending in {details.maskedCC}</span>}
                {details.expirationDate && (
                  <span className="text-ink-2 text-sm">Expires {details.expirationDate}</span>
                )}
              </div>
              <button
                type="button"
                className="btn-danger flex-none w-auto m-0 px-[18px] py-[9px] max768:w-full"
                disabled={deletingHash === token.public_hash}
                onClick={() => handleDelete(token)}
              >
                {deletingHash === token.public_hash ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StoredPaymentsTab;
