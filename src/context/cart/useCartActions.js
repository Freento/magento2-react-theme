import { useEffect, useState, startTransition } from 'react';
import { useApolloClient, useMutation, useQuery, useLazyQuery } from '@apollo/client';
import { useAuth, AUTH_EVENTS } from '../AuthContext';
import { useAuthEvents } from '../../hooks/useAuthEvents';
import {
  GET_CART_DETAILS,
  CREATE_EMPTY_CART,
  ADD_PRODUCTS_TO_CART,
  UPDATE_CART_ITEMS,
  REMOVE_ITEM_FROM_CART,
  MERGE_CARTS,
  GET_CUSTOMER_CART,
} from '../../queries/cart';
import { readCartCache, writeCartCache, clearCartCache } from './cartCache';
import { isDeadCartError } from './cartErrors';
import { useCartAuthSync } from './useCartAuthSync';

export const useCartActions = (state, dispatch) => {
  const { user, isAuthenticated, initialLoading: authInitialLoading } = useAuth();
  const apolloClient = useApolloClient();

  const [createEmptyCart] = useMutation(CREATE_EMPTY_CART);
  const [addProductsToCart] = useMutation(ADD_PRODUCTS_TO_CART);
  const [updateCartItems] = useMutation(UPDATE_CART_ITEMS);
  const [removeItemFromCart] = useMutation(REMOVE_ITEM_FROM_CART);
  const [mergeCarts] = useMutation(MERGE_CARTS);
  const [getCustomerCart] = useLazyQuery(GET_CUSTOMER_CART);

  const [cartRequested, setCartRequested] = useState(false);
  const loadCart = () => setCartRequested(true);
  const clearError = () => dispatch({ type: 'SET_ERROR', payload: null });

  useEffect(() => {
    if (!state.cartId) return;
    const cached = readCartCache(state.cartId);
    if (!cached) return;
    try {
      apolloClient.writeQuery({
        query: GET_CART_DETAILS,
        variables: { cartId: state.cartId },
        data: { cart: cached },
      });
      dispatch({ type: 'SET_CART_DATA', payload: cached });
    } catch (err) {
      console.warn('[cart hydrate]', err.message);
    }
  }, [state.cartId, apolloClient, dispatch]);

  const { data: cartData, refetch: refetchCart, error: cartError } = useQuery(GET_CART_DETAILS, {
    variables: { cartId: state.cartId },
    skip: !state.cartId || !cartRequested,
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true
  });

  useEffect(() => {
    if (cartData?.cart) {
      dispatch({ type: 'SET_CART_DATA', payload: cartData.cart });
      writeCartCache(state.cartId, cartData.cart);
    }
  }, [cartData, state.cartId, dispatch]);

  const recoverCart = async () => {
    clearCartCache(state.cartId);
    localStorage.removeItem('cartId');
    dispatch({ type: 'SET_CART_ID', payload: null });
    dispatch({ type: 'SET_CART_DATA', payload: null });
    try {
      const result = await createEmptyCart();
      const newCartId = result.data.createEmptyCart;
      localStorage.setItem('cartId', newCartId);
      dispatch({ type: 'SET_CART_ID', payload: newCartId });
      dispatch({ type: 'SET_ERROR', payload: null });
      return newCartId;
    } catch (createError) {
      console.error('Failed to create new cart after error:', createError);
      return null;
    }
  };

  useEffect(() => {
    if (!cartError) return;
    if (isDeadCartError(cartError)) {
      recoverCart();
    } else {
      dispatch({ type: 'SET_ERROR', payload: cartError.message });
    }
  }, [cartError]);

  const initializeCart = async (force = false) => {
    let cartId = localStorage.getItem('cartId');

    if (cartId && !force) {
      dispatch({ type: 'SET_CART_ID', payload: cartId });
      dispatch({ type: 'SET_CART_INITIALIZED' });
      return;
    }

    if (!force) {
      dispatch({ type: 'SET_CART_INITIALIZED' });
      return;
    }

    try {
      const result = await createEmptyCart();
      cartId = result.data.createEmptyCart;
      localStorage.setItem('cartId', cartId);
      dispatch({ type: 'SET_CART_ID', payload: cartId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create cart' });
    } finally {
      dispatch({ type: 'SET_CART_INITIALIZED' });
    }
  };

  useEffect(() => {
    startTransition(() => {
      initializeCart();
    });
  }, [createEmptyCart]);

  useAuthEvents({
    [AUTH_EVENTS.LOGOUT]: () => { initializeCart(true); },
    [AUTH_EVENTS.TOKEN_VALIDATED]: () => { initializeCart(true); },
    [AUTH_EVENTS.TOKEN_INVALID]: () => { initializeCart(true); },
  });

  const addToCart = async (sku, quantity = 1, selectedOptions = [], { openMiniCart: openAfterAdd = true } = {}) => {
    let cartId = state.cartId;
    if (!cartId) {
      try {
        const result = await createEmptyCart();
        cartId = result.data.createEmptyCart;
        localStorage.setItem('cartId', cartId);
        dispatch({ type: 'SET_CART_ID', payload: cartId });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to create cart' });
        throw error;
      }
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const result = await addProductsToCart({
        variables: {
          cartId,
          cartItems: [{
            sku,
            quantity,
            ...(selectedOptions.length ? { selected_options: selectedOptions } : {}),
          }],
        }
      });

      const userErrors = result.data?.addProductsToCart?.user_errors || [];
      if (result.errors?.length || userErrors.length) {
        const msg = userErrors[0]?.message || result.errors?.[0]?.message || 'Failed to add to bag';
        dispatch({ type: 'SET_ERROR', payload: msg });
        throw new Error(msg);
      }

      if (result.data?.addProductsToCart?.cart) {
        dispatch({ type: 'SET_CART_DATA', payload: result.data.addProductsToCart.cart });
      }

      setCartRequested(true);
      if (openAfterAdd) dispatch({ type: 'SET_IS_MINI_CART_OPEN', payload: true });
    } catch (error) {
      if (isDeadCartError(error)) { await recoverCart(); }
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Resolves to true when the line was updated, false when it failed, so
  // callers that need to act on the outcome (cart item editing) can branch.
  const updateQuantity = async (cartItemId, quantity) => {
    if (!state.cartId) return false;
    dispatch({ type: 'ADD_PENDING_ITEM', payload: cartItemId });
    try {
      const result = await updateCartItems({
        variables: {
          cartId: state.cartId,
          cartItems: [{ cart_item_id: cartItemId, quantity }],
        },
      });

      if (result.data?.updateCartItems?.cart) {
        dispatch({ type: 'SET_CART_DATA', payload: result.data.updateCartItems.cart });
      }
      return true;
    } catch (error) {
      if (isDeadCartError(error)) { await recoverCart(); }
      else dispatch({ type: 'SET_ERROR', payload: error.message });
      return false;
    } finally {
      dispatch({ type: 'REMOVE_PENDING_ITEM', payload: cartItemId });
    }
  };

  const removeItem = async (cartItemId, { silent = false } = {}) => {
    if (!state.cartId) return false;
    const removedName = state.cartData?.items?.find((it) => it.id === cartItemId)?.product?.name || 'Item';
    dispatch({ type: 'ADD_PENDING_ITEM', payload: cartItemId });
    try {
      const result = await removeItemFromCart({
        variables: {
          cartId: state.cartId,
          cartItemId: parseInt(cartItemId),
        },
      });

      if (result.data?.removeItemFromCart?.cart) {
        dispatch({ type: 'SET_CART_DATA', payload: result.data.removeItemFromCart.cart });
      }
      if (!silent) {
        dispatch({
          type: 'SET_LAST_REMOVED',
          payload: { id: cartItemId, name: removedName, at: Date.now() },
        });
      }
      return true;
    } catch (error) {
      if (isDeadCartError(error)) { await recoverCart(); }
      else dispatch({ type: 'SET_ERROR', payload: error.message });
      return false;
    } finally {
      dispatch({ type: 'REMOVE_PENDING_ITEM', payload: cartItemId });
    }
  };

  const clearLastRemoved = () => dispatch({ type: 'SET_LAST_REMOVED', payload: null });

  const openMiniCart = () => {
    setCartRequested(true);
    dispatch({ type: 'SET_IS_MINI_CART_OPEN', payload: true });
  };

  const closeMiniCart = () => dispatch({ type: 'SET_IS_MINI_CART_OPEN', payload: false });

  const getCartItemsCount = () => {
    if (!state.cartData?.items) return 0;
    return state.cartData.items.reduce((total, item) => total + item.quantity, 0);
  };

  const clearCart = async () => {
    try {
      const oldCartId = state.cartId;
      const result = await createEmptyCart();
      const newCartId = result.data.createEmptyCart;

      clearCartCache(oldCartId);
      localStorage.setItem('cartId', newCartId);
      dispatch({ type: 'SET_CART_ID', payload: newCartId });
      dispatch({ type: 'SET_CART_DATA', payload: null });
      dispatch({ type: 'SET_IS_MINI_CART_OPEN', payload: false });
    } catch (error) {
      console.error('Error clearing cart:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  useCartAuthSync({
    isAuthenticated,
    user,
    authInitialLoading,
    cartId: state.cartId,
    dispatch,
    getCustomerCart,
    mergeCarts,
    createEmptyCart,
    refetchCart,
  });

  return {
    addToCart,
    updateQuantity,
    removeItem,
    openMiniCart,
    closeMiniCart,
    getCartItemsCount,
    clearCart,
    clearLastRemoved,
    refetchCart,
    loadCart,
    clearError,
  };
};
