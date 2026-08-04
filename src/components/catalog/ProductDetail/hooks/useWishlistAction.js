import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '../../../../context/AuthContext';
import { ADD_PRODUCT_TO_WISHLIST, GET_CUSTOMER_WISHLIST } from '../../../../queries/customer';

// Add-to-wishlist action with a transient status message. Gates on auth and
// resolves the customer's wishlist id before mutating.
export default function useWishlistAction(product) {
  const { isAuthenticated, openLoginModal } = useAuth();
  const { data: wishlistData } = useQuery(GET_CUSTOMER_WISHLIST, { skip: !isAuthenticated });
  const [addProductToWishlist, { loading: wishlistLoading }] = useMutation(ADD_PRODUCT_TO_WISHLIST);
  const [wishlistMessage, setWishlistMessage] = useState('');

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) { openLoginModal(); return; }
    try {
      const wishlistId = wishlistData?.customer?.wishlists?.[0]?.id;
      if (!wishlistId) {
        setWishlistMessage('Wishlist not found. Please try again.');
        setTimeout(() => setWishlistMessage(''), 3000);
        return;
      }
      await addProductToWishlist({
        variables: { wishlistId, wishlistItems: [{ sku: product.sku, quantity: 1 }] },
        refetchQueries: [{ query: GET_CUSTOMER_WISHLIST }],
      });
      setWishlistMessage('Product added to wishlist!');
      setTimeout(() => setWishlistMessage(''), 3000);
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      setWishlistMessage(err.message || 'Failed to add to wishlist');
      setTimeout(() => setWishlistMessage(''), 5000);
    }
  };

  return { handleAddToWishlist, wishlistLoading, wishlistMessage };
}
