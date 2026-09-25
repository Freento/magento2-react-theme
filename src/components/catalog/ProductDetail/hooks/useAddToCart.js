import { useState } from 'react';
import { useCart } from '../../../../context/CartContext';
import { selectedOptionUids } from '../../../../lib/configurableOptions';

const sameUidSet = (a, b) => {
  if (a.length !== b.length) return false;
  const set = new Set(b);
  return a.every((uid) => set.has(uid));
};

export default function useAddToCart(product, isConfigurable, selectedVariant, selectedOptions, editContext) {
  const { addToCart, updateQuantity, removeItem, closeMiniCart, loading: cartLoading } = useCart();
  const [quantity, setQuantity] = useState(() => {
    const qty = Number(editContext?.quantity);
    return qty > 0 ? Math.min(qty, 9999) : 1;
  });
  const [addToCartError, setAddToCartError] = useState('');
  const [cartUpdating, setCartUpdating] = useState(false);

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

  const currentOptionUids = () =>
    (isConfigurable ? selectedOptionUids(product.configurable_options, selectedOptions) : []);

  // Adds the current configuration to the cart. Returns true on success.
  const addCurrentToCart = async ({ openMiniCart = true } = {}) => {
    if (!canAddToCart()) return false;
    setAddToCartError('');
    if (isConfigurable && !selectedVariant) {
      setAddToCartError('That combination is not available — try a different colour or size.');
      return false;
    }
    try {
      await addToCart(product.sku, quantity, currentOptionUids(), { openMiniCart });
      return true;
    } catch (err) {
      setAddToCartError(err?.message || 'Could not add to bag — please try again.');
      return false;
    }
  };

  const handleAddToCart = async () => { await addCurrentToCart(); };

  // Editing an existing cart line. When the configuration is unchanged only the
  // quantity can differ, so update the line in place — re-adding would merge
  // back into that same line and the follow-up remove would then wipe it
  // entirely. When the configuration changed, add the new one and drop the old
  // line, because updateCartItems cannot change a configurable's options.
  const handleUpdateCart = async () => {
    if (!editContext || !canAddToCart()) return false;
    setAddToCartError('');
    setCartUpdating(true);
    try {
      if (sameUidSet(currentOptionUids(), editContext.valueUids || [])) {
        if (quantity === editContext.quantity) return true;
        const ok = await updateQuantity(editContext.itemId, quantity);
        if (!ok) setAddToCartError('Could not update the cart — please try again.');
        return ok;
      }
      if (!await addCurrentToCart({ openMiniCart: false })) return false;
      await removeItem(editContext.itemId, { silent: true });
      closeMiniCart();
      return true;
    } finally {
      setCartUpdating(false);
    }
  };

  return {
    quantity,
    handleQuantityChange,
    incrementQuantity,
    decrementQuantity,
    canAddToCart,
    handleAddToCart,
    isEdit: !!editContext,
    handleUpdateCart,
    cartUpdating,
    cartLoading,
    addToCartError,
  };
}
