import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@apollo/client';
import { SUBSCRIBE_TO_NEWSLETTER } from '../../queries/newsletter';

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
      <form className="nl-form flex gap-2 min-w-0 max-w-[420px] mx-auto max480:flex-col" onSubmit={handleSubscribe}>
        <input
          className="nl-form-input flex-1 min-w-0 py-3 px-3.5 border border-line rounded bg-bg text-ink font-sans text-base leading-base [transition:border-color_0.15s,background_0.15s] placeholder:text-ink-2 focus:outline-none focus:bg-bg focus:border-ink disabled:opacity-50 disabled:cursor-not-allowed max480:w-full"
          type="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <button className="nl-form-button inline-flex items-center justify-center gap-2 py-3 px-5 bg-ink text-bg border border-ink rounded text-base font-medium tracking-[0.02em] cursor-pointer whitespace-nowrap [transition:background_0.2s,border-color_0.2s] enabled:hover:bg-black enabled:hover:border-black disabled:opacity-50 disabled:cursor-not-allowed max480:w-full" type="submit" disabled={loading}>
          <span>{buttonText}</span>
          {loading && <span className="nl-spinner inline-block w-3.5 h-3.5 border-2 border-current border-r-transparent rounded-full animate-spin opacity-90" aria-hidden="true" />}
        </button>
      </form>
      {message && typeof document !== 'undefined' && document.getElementById('toast-stack')
        && createPortal(
          <div
            className={`nl-toast fixed top-4 right-4 max-w-[360px] min-w-[240px] flex items-center justify-between gap-3 py-3 px-3.5 rounded text-[13px] shadow-[0_8px_24px_rgba(0,0,0,0.22)] z-[1100] text-bg ${messageType === 'error' ? 'nl-toast--error bg-sale' : 'nl-toast--success bg-ink'}`}
            role="status"
            aria-live="polite"
          >
            <span className="nl-toast-text leading-[1.4]">{message}</span>
            <button
              type="button"
              className="nl-toast-close shrink-0 w-6 h-6 inline-flex items-center justify-center bg-transparent border-0 cursor-pointer rounded-pill text-bg/65 transition-colors duration-fast ease-[ease] hover:text-bg hover:bg-bg/10"
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
