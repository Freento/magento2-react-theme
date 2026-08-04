import React, { createContext, useContext, useCallback, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { GET_CUSTOMER_WISHLIST, ADD_PRODUCTS_TO_WISHLIST, REMOVE_PRODUCTS_FROM_WISHLIST } from '../queries/customer';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const { data, loading, refetch } = useQuery(GET_CUSTOMER_WISHLIST, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network'
  });

  const [addProductsToWishlistMutation] = useMutation(ADD_PRODUCTS_TO_WISHLIST, {
    refetchQueries: ['getCustomerWishlist'],
    awaitRefetchQueries: true,
  });
  const [removeProductsFromWishlistMutation] = useMutation(REMOVE_PRODUCTS_FROM_WISHLIST, {
    refetchQueries: ['getCustomerWishlist'],
    awaitRefetchQueries: true,
    update(cache, _result, { variables }) {
      if (!variables?.wishlistId) return;
      const removedIds = new Set((variables.wishlistItemsIds || []).map(String));
      cache.modify({
        id: cache.identify({ __typename: 'Wishlist', id: variables.wishlistId }),
        fields: {
          items_count(existing) {
            return Math.max(0, (existing || 0) - removedIds.size);
          },
          items_v2(existing, { readField }) {
            if (!existing?.items) return existing;
            const items = existing.items.filter((ref) => !removedIds.has(String(readField('id', ref))));
            return { ...existing, items };
          },
        },
      });
    },
  });

  const [lastAdded, setLastAdded] = useState(null);
  const clearLastAdded = useCallback(() => setLastAdded(null), []);

  const wishlist = data?.customer?.wishlists?.[0];
  const wishlistId = wishlist?.id;
  const wishlistItems = wishlist?.items_v2?.items || [];

  const isInWishlist = useCallback((sku) => {
    return wishlistItems.some(item => item.product.sku === sku);
  }, [wishlistItems]);

  const addToWishlist = useCallback(async (sku, quantity = 1) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to add items to your wishlist');
    }

    if (!wishlistId) {
      throw new Error('Wishlist not found');
    }

    try {
      const result = await addProductsToWishlistMutation({
        variables: {
          wishlistId,
          wishlistItems: [{
            sku,
            quantity
          }]
        }
      });

      const added = result?.data?.addProductsToWishlist?.wishlist?.items_v2?.items?.find(
        (i) => i?.product?.sku === sku
      );
      setLastAdded({
        sku,
        name: added?.product?.name || sku,
        at: Date.now(),
      });

      await refetch();
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  }, [isAuthenticated, wishlistId, addProductsToWishlistMutation, refetch]);

  const removeFromWishlist = useCallback(async (wishlistItemId) => {
    if (!isAuthenticated || !wishlistId) {
      return;
    }

    try {
      await removeProductsFromWishlistMutation({
        variables: {
          wishlistId,
          wishlistItemsIds: [wishlistItemId]
        }
      });

      await refetch();
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  }, [isAuthenticated, wishlistId, removeProductsFromWishlistMutation, refetch]);

  const getWishlistItemId = useCallback((sku) => {
    const item = wishlistItems.find(item => item.product.sku === sku);
    return item?.id;
  }, [wishlistItems]);

  const value = {
    wishlist,
    wishlistItems,
    loading,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    getWishlistItemId,
    refetch,
    lastAdded,
    clearLastAdded,
    // Stable count used by the mobile bottom-nav badge.
    wishlistCount: wishlistItems.length,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
