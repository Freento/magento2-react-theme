import { useEffect, useState, startTransition } from 'react';
import { useApolloClient, useMutation, useQuery, useLazyQuery } from '@apollo/client';
import { useAuth, AUTH_EVENTS } from '../AuthContext';
import { useAuthEvents } from '../../hooks/useAuthEvents';
import {
  GET_CART_DETAILS,
  CREATE_EMPTY_CART,
  ADD_SIMPLE_PRODUCTS_TO_CART,
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
  const [addSimpleProductsToCart] = useMutation(ADD_SIMPLE_PRODUCTS_TO_CART);
  const [updateCartItems] = useMutation(UPDATE_CART_ITEMS);
  const [removeItemFromCart] = useMutation(REMOVE_ITEM_FROM_CART);
  const [mergeCarts] = useMutation(MERGE_CARTS);
  const [getCustomerCart] = useLazyQuery(GET_CUSTOMER_CART);

  const [cartRequested, setCartRequested] = useState(false);
  const loadCart = () => setCartRequested(true);

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
      dispatch({ type: 'SET_CART_RECOVERED', payload: { at: Date.now() } });
      return newCartId;
    } catch (createError) {
      console.error('Failed to create new cart after error:', createError);
      dispatch({ type: 'SET_ERROR', payload: 'Cart expired and we could not create a new one. Please refresh the page.' });
      return null;
    }
  };

  const clearCartRecovered = () => dispatch({ type: 'SET_CART_RECOVERED', payload: null });

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
      return;
    }

    if (!force) {
      return;
    }

    try {
      const result = await createEmptyCart();
      cartId = result.data.createEmptyCart;
      localStorage.setItem('cartId', cartId);
      dispatch({ type: 'SET_CART_ID', payload: cartId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create cart' });
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

  const addToCart = async (sku, quantity = 1) => {
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
      const result = await addSimpleProductsToCart({
        variables: {
          cartId,
          cartItems: [{ data: { quantity, sku } }]
        }
      });

      if (result.errors && result.errors.length) {
        const msg = result.errors[0]?.message || 'Failed to add to bag';
        dispatch({ type: 'SET_ERROR', payload: msg });
        throw new Error(msg);
      }

      if (result.data?.addSimpleProductsToCart?.cart) {
        dispatch({ type: 'SET_CART_DATA', payload: result.data.addSimpleProductsToCart.cart });
      }

      setCartRequested(true);
      dispatch({ type: 'SET_IS_MINI_CART_OPEN', payload: true });
    } catch (error) {
      if (isDeadCartError(error)) { await recoverCart(); }
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    if (!state.cartId) return;
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
    } catch (error) {
      if (isDeadCartError(error)) { await recoverCart(); }
      else dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'REMOVE_PENDING_ITEM', payload: cartItemId });
    }
  };

  const removeItem = async (cartItemId) => {
    if (!state.cartId) return;
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

      dispatch({
        type: 'SET_LAST_REMOVED',
        payload: { id: cartItemId, name: removedName, at: Date.now() },
      });
    } catch (error) {
      if (isDeadCartError(error)) { await recoverCart(); }
      else dispatch({ type: 'SET_ERROR', payload: error.message });
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
    clearCartRecovered,
    refetchCart,
    loadCart,
  };
};
