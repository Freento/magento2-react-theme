import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery } from '@apollo/client';
import { CONTACT_US, GET_CONTACT_ENABLED, GET_CONTACT_SUPPORT } from '../../queries/contact';

const CONTACT_INPUT = 'form-input placeholder:text-ink-2 disabled:opacity-50 disabled:cursor-not-allowed';

// `on` forces the form, `off` hides it, anything else (including unset) leaves the
// decision to the schema probe. The escape hatch exists because the probe reads the
// schema through introspection, which a store can switch off with Magento's
// `graphql/disable_introspection` — the form would then hide itself even though the
// module is installed.
const OVERRIDE = String(import.meta.env?.VITE_FEATURE_CONTACT_FORM ?? '').toLowerCase();
const OVERRIDDEN = OVERRIDE === 'on' || OVERRIDE === 'off';

const EMPTY = { name: '', email: '', telephone: '', comment: '' };

export default function ContactForm({ heading = '', intro = '', buttonText = 'Submit' }) {
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error'
  const [contactUs, { loading }] = useMutation(CONTACT_US);

  // Magento_ContactGraphQl only exists from 2.4.7 on, and the theme has to serve
  // older backends too. `errorPolicy: 'all'` is required, not cosmetic: Magento
  // answers an unknown type with `data.__type = null` *and* an `errors` entry, and
  // the default policy would throw the data away along with it.
  const { data: probe } = useQuery(GET_CONTACT_SUPPORT, {
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
    skip: OVERRIDDEN,
  });
  const supported = OVERRIDDEN
    ? OVERRIDE === 'on'
    : probe?.__type?.name === 'ContactUsInput';

  // Naming this field is a hard schema error where the module is missing, so it
  // has to stay in its own document behind the probe.
  const { data: config } = useQuery(GET_CONTACT_ENABLED, {
    fetchPolicy: 'cache-first',
    skip: !supported,
  });

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const flash = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => { setMessage(''); setMessageType(''); }, 6000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.comment.trim()) {
      flash('Please fill in your name, email and message.', 'error');
      return;
    }
    try {
      const { data } = await contactUs({
        variables: {
          name: form.name,
          email: form.email,
          // The schema takes telephone as nullable; an empty string would be
          // stored as one.
          telephone: form.telephone.trim() || null,
          comment: form.comment,
        },
      });
      if (data?.contactUs?.status) {
        setForm(EMPTY);
        flash('Thanks for reaching out — we’ll get back to you as quickly as possible.', 'success');
      } else {
        flash('Something went wrong. Please try again.', 'error');
      }
    } catch (error) {
      flash(error?.graphQLErrors?.[0]?.message || error?.message || 'Failed to send. Please try again.', 'error');
    }
  };

  if (!supported) return null;
  if (config?.storeConfig?.contact_enabled === false) return null;

  return (
    <>
      {/* Heading and intro belong to the block rather than to sibling Heading/Text
          blocks, so that a backend without the module hides the whole section
          instead of leaving a title standing over nothing. */}
      {heading ? <h2 className="contact-form-heading mt-0 mb-3 text-ink text-2xl font-semibold tracking-[-0.01em]">{heading}</h2> : null}
      {intro ? <p className="contact-form-intro mt-0 mb-6 max-w-[600px] text-ink-2 text-base leading-relaxed">{intro}</p> : null}

      <form className="contact-form form-grid max-w-[600px]" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label form-label--plain" htmlFor="contact-name">Name <span className="contact-form-req text-danger" aria-hidden="true">*</span></label>
          <input
            id="contact-name"
            className={CONTACT_INPUT}
            type="text"
            placeholder="Your name"
            value={form.name}
            onChange={set('name')}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label form-label--plain" htmlFor="contact-email">Email <span className="contact-form-req text-danger" aria-hidden="true">*</span></label>
          <input
            id="contact-email"
            className={CONTACT_INPUT}
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label form-label--plain" htmlFor="contact-telephone">Phone number</label>
          <input
            id="contact-telephone"
            className={CONTACT_INPUT}
            type="tel"
            placeholder="Optional"
            value={form.telephone}
            onChange={set('telephone')}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label form-label--plain" htmlFor="contact-comment">What’s on your mind? <span className="contact-form-req text-danger" aria-hidden="true">*</span></label>
          <textarea
            id="contact-comment"
            className="form-textarea placeholder:text-ink-2 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Your message"
            rows="6"
            value={form.comment}
            onChange={set('comment')}
            disabled={loading}
            required
          />
        </div>

        <button type="submit" className="contact-form-submit inline-flex items-center justify-center min-h-[44px] py-[11px] px-[22px] rounded text-base font-medium tracking-[0.02em] cursor-pointer bg-ink text-bg border border-ink transition-colors duration-fast ease-[ease] enabled:hover:bg-black enabled:hover:text-bg gap-2 justify-self-start disabled:opacity-60 disabled:cursor-not-allowed" disabled={loading} aria-busy={loading}>
          <span>{loading ? 'Sending…' : buttonText}</span>
          {loading && <span className="btn-spinner" aria-hidden="true" />}
        </button>
      </form>

      {message && typeof document !== 'undefined' && document.getElementById('toast-stack')
        && createPortal(
          <div
            className={`wl-toast wl-toast--${messageType}`}
            role={messageType === 'error' ? 'alert' : 'status'}
            aria-live={messageType === 'error' ? 'assertive' : 'polite'}
          >
            <span className="wl-toast-text">{message}</span>
            <button
              type="button"
              className="wl-toast-close"
              onClick={() => { setMessage(''); setMessageType(''); }}
              aria-label="Dismiss"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
