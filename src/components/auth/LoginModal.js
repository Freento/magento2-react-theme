import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/auth/AuthModal.less';

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
    <div className="auth-scrim" onClick={closeLoginModal} role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="auth-close"
          onClick={closeLoginModal}
          aria-label="Close sign in"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="auth-head">
          <span className="auth-eyebrow">Welcome back</span>
          <h2 id="auth-title" className="auth-title">Sign in</h2>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span className="auth-label">Email</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              autoComplete="email"
              required
              placeholder="you@email.com"
              className="auth-input"
            />
          </label>

          <label className="auth-field">
            <span className="auth-label-row">
              <span className="auth-label">Password</span>
              <button
                type="button"
                className="auth-helper"
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
              className="auth-input"
            />
          </label>

          <button
            type="submit"
            disabled={submitDisabled}
            className="auth-submit"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-foot">
          New here?{' '}
          <button type="button" className="auth-link" onClick={switchToRegister}>
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
