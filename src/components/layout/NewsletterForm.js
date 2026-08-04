import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@apollo/client';
import { SUBSCRIBE_TO_NEWSLETTER } from '../../queries/newsletter';
import '../../styles/layout/NewsletterForm.less';

export default function NewsletterForm({
  buttonText = 'Subscribe',
  placeholder = 'Enter your email address',
}) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error'
  const [subscribeToNewsletter, { loading }] = useMutation(SUBSCRIBE_TO_NEWSLETTER);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return;
    }
    try {
      const { data } = await subscribeToNewsletter({ variables: { email } });
      if (data?.subscribeEmailToNewsletter?.status === 'SUBSCRIBED') {
        setMessage('Thank you for subscribing to our newsletter!');
      } else {
        setMessage('You are already subscribed to our newsletter.');
      }
      setMessageType('success');
      setEmail('');
      setTimeout(() => { setMessage(''); setMessageType(''); }, 5000);
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setMessage(error.message || 'Failed to subscribe. Please try again.');
      setMessageType('error');
      setTimeout(() => { setMessage(''); setMessageType(''); }, 5000);
    }
  };

  return (
    <>
      <form className="nl-form" onSubmit={handleSubscribe}>
        <input
          className="nl-form-input"
          type="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <button className="nl-form-button" type="submit" disabled={loading}>
          <span>{buttonText}</span>
          {loading && <span className="nl-spinner" aria-hidden="true" />}
        </button>
      </form>
      {message && typeof document !== 'undefined' && document.getElementById('toast-stack')
        && createPortal(
          <div className={`nl-toast nl-toast--${messageType}`} role="status" aria-live="polite">
            <span className="nl-toast-text">{message}</span>
            <button
              type="button"
              className="nl-toast-close"
              onClick={() => { setMessage(''); setMessageType(''); }}
              aria-label="Dismiss"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>,
          document.getElementById('toast-stack')
        )
      }
    </>
  );
}
