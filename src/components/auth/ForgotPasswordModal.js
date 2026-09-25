import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

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
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-[1000] p-4 animate-scrim" onClick={closeForgotModal} role="dialog" aria-modal="true" aria-labelledby="auth-title-forgot">
      <div className="relative w-full max-w-[420px] bg-bg border border-line rounded-lg pt-9 px-8 pb-7 shadow-[0_20px_40px_rgba(0,0,0,0.12)] animate-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="absolute top-3 right-3 w-8 h-8 inline-flex items-center justify-center bg-transparent border-0 cursor-pointer rounded-pill text-ink-2 transition-colors duration-fast ease-[ease] hover:bg-surface hover:text-ink"
          onClick={closeForgotModal}
          aria-label="Close reset password"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="mb-[22px]">
          <span className="block text-sm font-medium tracking-[0.12em] uppercase text-ink-2 mb-2.5">Account help</span>
          <h2 id="auth-title-forgot" className="mt-0 mb-2 text-[26px] font-semibold text-ink tracking-[-0.015em] leading-tight">
            {sent ? 'Check your inbox' : 'Reset password'}
          </h2>
          <p className="m-0 text-base leading-relaxed text-ink-2">
            {sent
              ? `If an account exists for ${email}, we just sent a link to reset your password. It should arrive within a minute or two.`
              : 'Enter the email tied to your account and we’ll send a link to set a new password.'}
          </p>
        </div>

        {sent ? (
          <button
            type="button"
            className="inline-flex items-center justify-center min-h-12 px-[22px] py-[11px] rounded text-base font-medium tracking-[0.02em] cursor-pointer transition-colors duration-med ease-[ease] bg-ink text-bg border border-ink w-full mt-1.5 hover:enabled:bg-black hover:enabled:text-bg disabled:bg-surface disabled:text-ink-2 disabled:border-line disabled:cursor-not-allowed"
            onClick={switchToLogin}
          >
            Back to sign in
          </button>
        ) : (
          <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium tracking-[0.04em] text-ink">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="you@email.com"
                className="w-full h-11 px-3.5 border border-line rounded bg-bg text-ink [font-family:inherit] leading-base text-base [transition:border-color_120ms_ease,box-shadow_120ms_ease] placeholder:text-ink-2 placeholder:opacity-70 focus:outline-none focus:border-ink focus:[box-shadow:0_0_0_1px_var(--ink)]"
                autoFocus
              />
            </label>

            <button
              type="submit"
              disabled={submitDisabled}
              className="inline-flex items-center justify-center min-h-12 px-[22px] py-[11px] rounded text-base font-medium tracking-[0.02em] cursor-pointer transition-colors duration-med ease-[ease] bg-ink text-bg border border-ink w-full mt-1.5 hover:enabled:bg-black hover:enabled:text-bg disabled:bg-surface disabled:text-ink-2 disabled:border-line disabled:cursor-not-allowed"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        {!sent && (
          <div className="mt-[22px] pt-[18px] border-t border-line text-center text-13 text-ink-2">
            Remembered it?{' '}
            <button type="button" className="p-0 text-ink text-13 underline underline-offset-2 font-medium hover:text-ink-2" onClick={switchToLogin}>
              Back to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
