import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/auth/AuthModal.less';

const RegisterModal = () => {
  const {
    isRegisterModalOpen,
    closeRegisterModal,
    switchToLogin,
    register,
    loading,
    setAuthError,
  } = useAuth();

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const setValidationError = setAuthError;
  useEffect(() => {
    if (!isRegisterModalOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') closeRegisterModal(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isRegisterModalOpen, closeRegisterModal]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.firstname.trim()) return setValidationError('First name is required'), false;
    if (!formData.lastname.trim()) return setValidationError('Last name is required'), false;
    if (!formData.email.trim()) return setValidationError('Email is required'), false;
    if (!formData.password) return setValidationError('Password is required'), false;
    if (formData.password.length < 8) return setValidationError('Password must be at least 8 characters long'), false;
    if (formData.password !== formData.confirmPassword) return setValidationError('Passwords do not match'), false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    await register({
      firstname: formData.firstname,
      lastname: formData.lastname,
      email: formData.email,
      password: formData.password,
    });
  };

  const isFormValid =
    formData.firstname && formData.lastname && formData.email &&
    formData.password && formData.confirmPassword &&
    formData.password === formData.confirmPassword &&
    formData.password.length >= 8;

  if (!isRegisterModalOpen) return null;
  const submitDisabled = loading || !isFormValid;
  const mismatch =
    formData.password && formData.confirmPassword &&
    formData.password !== formData.confirmPassword;

  return (
    <div className="auth-scrim" onClick={closeRegisterModal} role="dialog" aria-modal="true" aria-labelledby="auth-title-register">
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="auth-close"
          onClick={closeRegisterModal}
          aria-label="Close create account"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="auth-head">
          <span className="auth-eyebrow">New here</span>
          <h2 id="auth-title-register" className="auth-title">Create account</h2>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-row-2">
            <label className="auth-field">
              <span className="auth-label">First name</span>
              <input
                type="text"
                name="firstname"
                value={formData.firstname}
                onChange={handleInputChange}
                autoComplete="given-name"
                required
                placeholder="Jane"
                className="auth-input"
              />
            </label>
            <label className="auth-field">
              <span className="auth-label">Last name</span>
              <input
                type="text"
                name="lastname"
                value={formData.lastname}
                onChange={handleInputChange}
                autoComplete="family-name"
                required
                placeholder="Doe"
                className="auth-input"
              />
            </label>
          </div>

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
            <span className="auth-label">Password</span>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              autoComplete="new-password"
              minLength="8"
              required
              placeholder="••••••••"
              className="auth-input"
            />
            <span className="auth-hint">At least 8 characters.</span>
          </label>

          <label className="auth-field">
            <span className="auth-label">Confirm password</span>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              autoComplete="new-password"
              required
              placeholder="••••••••"
              className={`auth-input${mismatch ? ' auth-input--error' : ''}`}
            />
          </label>

          <button
            type="submit"
            disabled={submitDisabled}
            className="auth-submit"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="auth-foot">
          Already have an account?{' '}
          <button type="button" className="auth-link" onClick={switchToLogin}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
