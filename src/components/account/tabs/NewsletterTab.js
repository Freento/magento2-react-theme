import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { UPDATE_CUSTOMER_PROFILE } from '../../../queries/customer';

const NewsletterTab = ({ customer, onSuccess, onError }) => {
  const [isSubscribed, setIsSubscribed] = useState(!!customer.is_subscribed);
  const [updateCustomer, { loading }] = useMutation(UPDATE_CUSTOMER_PROFILE);

  useEffect(() => {
    setIsSubscribed(!!customer.is_subscribed);
  }, [customer.is_subscribed]);

  const handleSave = async () => {
    try {
      const result = await updateCustomer({ variables: { input: { is_subscribed: isSubscribed } } });
      const saved = result.data?.updateCustomer?.customer?.is_subscribed;
      onSuccess(saved ? 'You have been subscribed to the newsletter.' : 'You have been unsubscribed from the newsletter.');
    } catch (err) {
      onError(err?.graphQLErrors?.[0]?.message || err.message || 'Could not save the subscription — please try again.');
    }
  };

  return (
    <div className="account-section">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="newsletterSubscription"
          className="w-4 h-4 accent-ink m-0 cursor-pointer"
          checked={isSubscribed}
          onChange={(e) => setIsSubscribed(e.target.checked)}
        />
        <label htmlFor="newsletterSubscription" className="text-13 font-normal text-ink-2 m-0 cursor-pointer">General Subscription</label>
      </div>

      <div className="mt-5">
        <button
          type="button"
          className="btn-primary"
          onClick={handleSave}
          disabled={loading || isSubscribed === !!customer.is_subscribed}
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
};

export default NewsletterTab;
