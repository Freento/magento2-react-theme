import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const LoginModal = () => {
  const {
    isLoginModalOpen,
    closeLoginModal,
    switchToRegister,
    openForgotModal,
    login,
    loading,
  } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });

  // Esc closes; body scroll lock while open
  useEffect(() => {
    if (!isLoginModalOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') closeLoginModal(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isLoginModalOpen, closeLoginModal]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    await login(formData.email, formData.password);
  };

  if (!isLoginModalOpen) return null;
  const submitDisabled = loading || !formData.email || !formData.password;

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-[1000] p-4 animate-scrim" onClick={closeLoginModal} role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className="relative w-full max-w-[420px] bg-bg border border-line rounded-lg pt-9 px-8 pb-7 shadow-[0_20px_40px_rgba(0,0,0,0.12)] animate-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="absolute top-3 right-3 w-8 h-8 inline-flex items-center justify-center bg-transparent border-0 cursor-pointer rounded-pill text-ink-2 transition-colors duration-fast ease-[ease] hover:bg-surface hover:text-ink"
          onClick={closeLoginModal}
          aria-label="Close sign in"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="mb-[22px]">
          <span className="block text-sm font-medium tracking-[0.12em] uppercase text-ink-2 mb-2.5">Welcome back</span>
          <h2 id="auth-title" className="mt-0 mb-2 text-[26px] font-semibold text-ink tracking-[-0.015em] leading-tight">Sign in</h2>
        </div>

        <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium tracking-[0.04em] text-ink">Email</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              autoComplete="email"
              required
              placeholder="you@email.com"
              className="w-full h-11 px-3.5 border border-line rounded bg-bg text-ink [font-family:inherit] leading-base text-base [transition:border-color_120ms_ease,box-shadow_120ms_ease] placeholder:text-ink-2 placeholder:opacity-70 focus:outline-none focus:border-ink focus:[box-shadow:0_0_0_1px_var(--ink)]"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="flex justify-between items-baseline">
              <span className="text-sm font-medium tracking-[0.04em] text-ink">Password</span>
              <button
                type="button"
                className="text-sm text-ink-2 underline underline-offset-2 bg-transparent border-0 p-0 cursor-pointer hover:text-ink"
                onClick={openForgotModal}
              >
                Forgot?
              </button>
            </span>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full h-11 px-3.5 border border-line rounded bg-bg text-ink [font-family:inherit] leading-base text-base [transition:border-color_120ms_ease,box-shadow_120ms_ease] placeholder:text-ink-2 placeholder:opacity-70 focus:outline-none focus:border-ink focus:[box-shadow:0_0_0_1px_var(--ink)]"
            />
          </label>

          <button
            type="submit"
            disabled={submitDisabled}
            className="inline-flex items-center justify-center min-h-12 px-[22px] py-[11px] rounded text-base font-medium tracking-[0.02em] cursor-pointer transition-colors duration-med ease-[ease] bg-ink text-bg border border-ink w-full mt-1.5 hover:enabled:bg-black hover:enabled:text-bg disabled:bg-surface disabled:text-ink-2 disabled:border-line disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-[22px] pt-[18px] border-t border-line text-center text-13 text-ink-2">
          New here?{' '}
          <button type="button" className="p-0 text-ink text-13 underline underline-offset-2 font-medium hover:text-ink-2" onClick={switchToRegister}>
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
