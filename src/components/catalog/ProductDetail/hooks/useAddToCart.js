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
  const [quantityInput, setQuantityInput] = useState(() => String(quantity));
  const setBoth = (n) => { setQuantity(n); setQuantityInput(String(n)); };
  const [cartUpdating, setCartUpdating] = useState(false);

  const handleQuantityChange = (value) => {
    if (value === '') { setQuantityInput(''); return; }
    if (!/^\d+$/.test(value)) return;
    const numValue = parseInt(value, 10);
    if (numValue > 9999) return;
    setQuantityInput(value);
    if (numValue > 0) setQuantity(numValue);
  };
  const commitQuantity = () => {
    const numValue = parseInt(quantityInput, 10);
    setBoth(Number.isFinite(numValue) && numValue > 0 ? Math.min(numValue, 9999) : 1);
  };
  const incrementQuantity = () => { if (quantity < 9999) setBoth(quantity + 1); };
  const decrementQuantity = () => { if (quantity > 1) setBoth(quantity - 1); };

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
    if (isConfigurable && !selectedVariant) return false;
    try {
      await addToCart(product.sku, quantity, currentOptionUids(), { openMiniCart });
      return true;
    } catch {
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
    setCartUpdating(true);
    try {
      if (sameUidSet(currentOptionUids(), editContext.valueUids || [])) {
        if (quantity === editContext.quantity) return true;
        return updateQuantity(editContext.itemId, quantity);
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
    quantityInput,
    commitQuantity,
    handleQuantityChange,
    incrementQuantity,
    decrementQuantity,
    canAddToCart,
    handleAddToCart,
    isEdit: !!editContext,
    handleUpdateCart,
    cartUpdating,
    cartLoading,
  };
}
