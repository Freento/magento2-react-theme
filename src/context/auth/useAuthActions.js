import { useEffect, startTransition } from 'react';
import { useMutation, useLazyQuery } from '@apollo/client';
import {
  CREATE_CUSTOMER,
  REVOKE_CUSTOMER_TOKEN,
  GENERATE_CUSTOMER_TOKEN,
  REQUEST_PASSWORD_RESET,
} from '../../queries/auth';
// The one canonical customer query: auth shares the document with MyAccount and
// checkout, so a page needs a single getCustomer request instead of two.
import { GET_CUSTOMER_DATA } from '../../queries/customer';
import { AUTH_EVENTS, dispatchAuthEvent } from './authEvents';
import { mapLoginError } from './authErrors';
import { readCustomerToken, writeCustomerToken, clearCustomerToken } from '../../lib/customerToken';

export const useAuthActions = (state, dispatch) => {
  const [createCustomer] = useMutation(CREATE_CUSTOMER);
  const [revokeCustomerToken] = useMutation(REVOKE_CUSTOMER_TOKEN);
  const [generateCustomerToken] = useMutation(GENERATE_CUSTOMER_TOKEN);
  const [requestPasswordResetMutation] = useMutation(REQUEST_PASSWORD_RESET);
  const [getCustomer] = useLazyQuery(GET_CUSTOMER_DATA);

  const loadCustomer = async ({ fromMount = false } = {}) => {
    const token = readCustomerToken();
    if (!token) {
      if (fromMount) dispatch({ type: 'SET_INITIAL_LOADING', payload: false });
      return;
    }
    dispatch({ type: 'SET_TOKEN', payload: token });
    dispatch({ type: fromMount ? 'SET_INITIAL_LOADING' : 'SET_LOADING', payload: true });
    try {
      const result = await getCustomer();
      if (result.data?.customer) {
        dispatch({ type: 'SET_USER', payload: result.data.customer });
        dispatchAuthEvent(AUTH_EVENTS.TOKEN_VALIDATED, result.data.customer);
        return result.data.customer;
      } else {
        clearCustomerToken();
        dispatch({ type: 'LOGOUT' });
        dispatchAuthEvent(AUTH_EVENTS.TOKEN_INVALID);
      }
    } catch (error) {
      const status = error.networkError?.statusCode;
      const isAuth = status === 401 || status === 403 ||
          error.graphQLErrors?.some(e => e.extensions?.category === 'graphql-authorization');
      if (isAuth) {
        clearCustomerToken();
        dispatch({ type: 'LOGOUT' });
        dispatchAuthEvent(AUTH_EVENTS.TOKEN_INVALID);
      }
      if (!fromMount) throw error;
    } finally {
      dispatch({ type: fromMount ? 'SET_INITIAL_LOADING' : 'SET_LOADING', payload: false });
    }
  };

  const login = async (email, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const result = await generateCustomerToken({
        variables: { email, password },
      });

      const token = result?.data?.generateCustomerToken?.token;
      if (!token) {
        const msg = result?.errors?.[0]?.message || 'Invalid credentials';
        throw new Error(msg);
      }

      // The cookie is the only place the token lives, so a refused write is a failed
      // sign-in, not a degraded one.
      if (!writeCustomerToken(token)) {
        throw new Error(
          'Your browser is blocking cookies for this site, so we cannot keep you signed in. '
          + 'Allow cookies and try again.'
        );
      }
      const customer = await loadCustomer();
      dispatch({ type: 'SET_LOGIN_MODAL', payload: false });
      const greeting = customer?.firstname
        ? `Welcome back, ${customer.firstname}!`
        : 'You are signed in.';
      dispatch({ type: 'SET_SUCCESS', payload: greeting });
      return { success: true };
    } catch (error) {
      const message = mapLoginError(error);
      dispatch({ type: 'SET_ERROR', payload: message });
      return { success: false, error: message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const register = async (customerData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const result = await createCustomer({
        variables: { input: customerData }
      });

      if (result.data?.createCustomer?.customer) {
        const loginResult = await login(customerData.email, customerData.password);
        if (loginResult.success) {
          dispatch({ type: 'SET_REGISTER_MODAL', payload: false });
          dispatch({ type: 'SET_SUCCESS', payload: `Welcome, ${customerData.firstname || 'friend'}!` });
        }
        return { success: true };
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = async () => {
    try {
      await revokeCustomerToken();
    } catch (error) {
      console.error('GraphQL revoke token failed:', error);
    }

    try {
      await fetch('/customer/ajax/logout', {
        method: 'GET',
        credentials: 'include'
      });
    } catch (error) {
      console.error('REST logout request failed:', error);
    } finally {
      clearCustomerToken();
      dispatch({ type: 'LOGOUT' });
      dispatchAuthEvent(AUTH_EVENTS.LOGOUT);
      if (typeof window !== 'undefined') {
        window.location.assign('/');
      }
    }
  };

  const requestPasswordReset = async (email) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      await requestPasswordResetMutation({ variables: { email } });
      return { success: true };
    } catch (error) {
      const message = error?.graphQLErrors?.[0]?.message || error.message || 'Request failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      return { success: false, error: message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const setAuthError = (msg) => dispatch({ type: 'SET_ERROR', payload: msg || null });

  const openLoginModal = () => {
    dispatch({ type: 'SET_LOGIN_MODAL', payload: true });
    dispatch({ type: 'SET_REGISTER_MODAL', payload: false });
  };
  const closeLoginModal = () => dispatch({ type: 'SET_LOGIN_MODAL', payload: false });
  const openRegisterModal = () => {
    dispatch({ type: 'SET_REGISTER_MODAL', payload: true });
    dispatch({ type: 'SET_LOGIN_MODAL', payload: false });
  };
  const closeRegisterModal = () => dispatch({ type: 'SET_REGISTER_MODAL', payload: false });
  const switchToRegister = () => {
    dispatch({ type: 'SET_LOGIN_MODAL', payload: false });
    dispatch({ type: 'SET_REGISTER_MODAL', payload: true });
  };
  const switchToLogin = () => {
    dispatch({ type: 'SET_REGISTER_MODAL', payload: false });
    dispatch({ type: 'SET_FORGOT_MODAL', payload: false });
    dispatch({ type: 'SET_LOGIN_MODAL', payload: true });
  };
  const openForgotModal = () => {
    dispatch({ type: 'SET_LOGIN_MODAL', payload: false });
    dispatch({ type: 'SET_REGISTER_MODAL', payload: false });
    dispatch({ type: 'SET_FORGOT_MODAL', payload: true });
  };
  const closeForgotModal = () => dispatch({ type: 'SET_FORGOT_MODAL', payload: false });

  useEffect(() => {
    startTransition(() => {
      loadCustomer({ fromMount: true });
    });
  }, []);

  useEffect(() => {
    const handle = () => {
      if (state.isAuthenticated) {
        dispatch({ type: 'LOGOUT' });
      }
    };
    window.addEventListener('auth:token-expired', handle);
    return () => window.removeEventListener('auth:token-expired', handle);
  }, [state.isAuthenticated, dispatch]);

  useEffect(() => {
    if (!state.success) return undefined;
    const t = setTimeout(() => dispatch({ type: 'SET_SUCCESS', payload: null }), 3500);
    return () => clearTimeout(t);
  }, [state.success, dispatch]);

  return {
    login,
    register,
    logout,
    setAuthError,
    requestPasswordReset,
    openLoginModal,
    closeLoginModal,
    openRegisterModal,
    closeRegisterModal,
    openForgotModal,
    closeForgotModal,
    switchToRegister,
    switchToLogin,
  };
};
