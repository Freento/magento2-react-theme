// Native-Magento checkout handoff: build a hidden form and POST the quote
// (and customer token when signed in) to Magento's checkout controller.
// Used only when VITE_CHECKOUT_MODE=magento. Extracted from MiniCart.
export function submitMagentoCheckout(cartId, { token, isAuthenticated } = {}) {
  if (!cartId) return;

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/checkout/index/index';

  const quoteInput = document.createElement('input');
  quoteInput.type = 'hidden';
  quoteInput.name = 'quote_id';
  quoteInput.value = cartId;
  form.appendChild(quoteInput);

  if (isAuthenticated) {
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'customer_token';
    tokenInput.value = token;
    form.appendChild(tokenInput);
  }

  document.body.appendChild(form);
  form.submit();
}
