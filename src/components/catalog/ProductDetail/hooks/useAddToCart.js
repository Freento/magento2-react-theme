import { useState } from 'react';
import { useCart } from '../../../../context/CartContext';

export default function useAddToCart(product, isConfigurable, selectedVariant, selectedOptions) {
  const { addToCart, loading: cartLoading } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addToCartError, setAddToCartError] = useState('');

  const handleQuantityChange = (value) => {
    const numValue = parseInt(value);
    if (numValue > 0 && numValue <= 9999) setQuantity(numValue);
  };
  const incrementQuantity = () => { if (quantity < 9999) setQuantity(quantity + 1); };
  const decrementQuantity = () => { if (quantity > 1) setQuantity(quantity - 1); };

  const canAddToCart = () => {
    if (!isConfigurable) return true;
    return product.configurable_options?.every(
      (option) => selectedOptions[option.attribute_code] !== undefined
    );
  };

  const handleAddToCart = async () => {
    if (!canAddToCart()) return;
    setAddToCartError('');
    if (isConfigurable) {
      if (!selectedVariant) {
        setAddToCartError('That combination is not available — try a different colour or size.');
        return;
      }
      try {
        await addToCart(selectedVariant.product.sku, quantity);
      } catch (err) {
        setAddToCartError(err?.message || 'Could not add to bag — please try again.');
      }
      return;
    }
    try {
      await addToCart(product.sku, quantity);
    } catch (err) {
      setAddToCartError(err?.message || 'Could not add to bag — please try again.');
    }
  };

  return {
    quantity,
    handleQuantityChange,
    incrementQuantity,
    decrementQuantity,
    canAddToCart,
    handleAddToCart,
    cartLoading,
    addToCartError,
  };
}
