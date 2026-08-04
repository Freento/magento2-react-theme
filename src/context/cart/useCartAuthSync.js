import { useEffect, useRef } from 'react';
import { clearCartCache } from './cartCache';

export const useCartAuthSync = ({
  isAuthenticated,
  user,
  authInitialLoading,
  cartId,
  dispatch,
  getCustomerCart,
  mergeCarts,
  createEmptyCart,
  refetchCart,
}) => {
  const isInitialMount = useRef(true);
  const previousAuthState = useRef({ isAuthenticated: false, userId: null });

  useEffect(() => {
    const handleAuth = async () => {
      const wasNotAuthenticated = !previousAuthState.current.isAuthenticated;
      const isNowAuthenticated = isAuthenticated && user;
      const currentUserId = user?.email || user?.id || null;
      const userIdChanged = previousAuthState.current.userId !== currentUserId;

      previousAuthState.current = {
        isAuthenticated,
        userId: currentUserId
      };

      if (!isInitialMount.current && !authInitialLoading && isNowAuthenticated && cartId && (wasNotAuthenticated || userIdChanged)) {

        dispatch({ type: 'SET_MERGING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
          const customerCartResult = await getCustomerCart();
          const customerCart = customerCartResult.data?.customerCart;

          if (customerCart && customerCart.id) {
            if (customerCart.id === cartId) {
              dispatch({ type: 'SET_CART_DATA', payload: customerCart });
              await refetchCart();
            } else {
              const mergeResult = await mergeCarts({
                variables: {
                  sourceCartId: cartId, // Guest cart
                  destinationCartId: customerCart.id // Customer cart
                }
              });

              if (mergeResult.data?.mergeCarts) {
                const mergedCart = mergeResult.data.mergeCarts;

                if (cartId && cartId !== mergedCart.id) {
                  clearCartCache(cartId);
                }
                localStorage.setItem('cartId', mergedCart.id);
                dispatch({ type: 'SET_CART_ID', payload: mergedCart.id });
                dispatch({ type: 'SET_CART_DATA', payload: mergedCart });
              }
            }
          } else {

            const mergeResult = await mergeCarts({
              variables: {
                sourceCartId: cartId,
                destinationCartId: null
              }
            });

            if (mergeResult.data?.mergeCarts) {
              const merged = mergeResult.data.mergeCarts;

              localStorage.setItem('cartId', merged.id);
              dispatch({ type: 'SET_CART_ID', payload: merged.id });
              dispatch({ type: 'SET_CART_DATA', payload: merged });
            }
          }
        } catch (error) {
          console.error('Error during cart merge/conversion:', error);

          if (error.message?.includes('cannot perform operations on cart') ||
              error.graphQLErrors?.some(err => err.extensions?.category === 'graphql-authorization')) {

            const customerCartResult = await getCustomerCart();
            const customerCart = customerCartResult.data?.customerCart;

            if (customerCart?.id) {
              localStorage.setItem('cartId', customerCart.id);
              dispatch({ type: 'SET_CART_ID', payload: customerCart.id });
              dispatch({ type: 'SET_CART_DATA', payload: customerCart });
            } else {
              const newCartResult = await createEmptyCart();
              const newCartId = newCartResult.data.createEmptyCart;
              localStorage.setItem('cartId', newCartId);
              dispatch({ type: 'SET_CART_ID', payload: newCartId });
              dispatch({ type: 'SET_CART_DATA', payload: null });
            }
          }
        } finally {
          dispatch({ type: 'SET_MERGING', payload: false });
        }
      }

      if (isInitialMount.current && !authInitialLoading) {
        isInitialMount.current = false;
      }
    };

    if (cartId) {
      handleAuth();
    } else {
      if (isInitialMount.current && !authInitialLoading) {
        isInitialMount.current = false;
        const currentUserId = user?.email || user?.id || null;
        previousAuthState.current = {
          isAuthenticated,
          userId: currentUserId
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, cartId, authInitialLoading, getCustomerCart, mergeCarts]);
};
