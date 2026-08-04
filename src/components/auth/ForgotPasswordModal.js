import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/auth/AuthModal.less';

const ForgotPasswordModal = () => {
  const {
    isForgotModalOpen,
    closeForgotModal,
    switchToLogin,
    requestPasswordReset,
    loading,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!isForgotModalOpen) {
      setSent(false);
      return;
    }
    const onKey = (e) => { if (e.key === 'Escape') closeForgotModal(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isForgotModalOpen, closeForgotModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    const result = await requestPasswordReset(email.trim());
    if (result.success) setSent(true);
  };

  if (!isForgotModalOpen) return null;
  const submitDisabled = loading || !email.trim();

  return (
    <div className="auth-scrim" onClick={closeForgotModal} role="dialog" aria-modal="true" aria-labelledby="auth-title-forgot">
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="auth-close"
          onClick={closeForgotModal}
          aria-label="Close reset password"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="auth-head">
          <span className="auth-eyebrow">Account help</span>
          <h2 id="auth-title-forgot" className="auth-title">
            {sent ? 'Check your inbox' : 'Reset password'}
          </h2>
          <p className="auth-text">
            {sent
              ? `If an account exists for ${email}, we just sent a link to reset your password. It should arrive within a minute or two.`
              : 'Enter the email tied to your account and we’ll send a link to set a new password.'}
          </p>
        </div>

        {sent ? (
          <button
            type="button"
            className="auth-submit"
            onClick={switchToLogin}
          >
            Back to sign in
          </button>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span className="auth-label">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="you@email.com"
                className="auth-input"
                autoFocus
              />
            </label>

            <button
              type="submit"
              disabled={submitDisabled}
              className="auth-submit"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        {!sent && (
          <div className="auth-foot">
            Remembered it?{' '}
            <button type="button" className="auth-link" onClick={switchToLogin}>
              Back to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
