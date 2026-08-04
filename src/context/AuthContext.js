import React, { createContext, useContext, useReducer } from 'react';
import { authReducer, initialAuthState } from './auth/authReducer';
import { useAuthActions } from './auth/useAuthActions';
import AuthToast from './auth/AuthToast';

export { AUTH_EVENTS, dispatchAuthEvent } from './auth/authEvents';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  const actions = useAuthActions(state, dispatch);

  const value = { ...state, ...actions };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthToast message={state.error}   onClose={() => dispatch({ type: 'SET_ERROR',   payload: null })} kind="error" />
      <AuthToast message={state.success} onClose={() => dispatch({ type: 'SET_SUCCESS', payload: null })} kind="success" />
    </AuthContext.Provider>
  );
};
