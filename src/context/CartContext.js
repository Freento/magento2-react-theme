import React, { createContext, useContext, useReducer } from 'react';
import { cartReducer, initialCartState } from './cart/cartReducer';
import { useCartActions } from './cart/useCartActions';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);
  const actions = useCartActions(state, dispatch);

  const value = { ...state, ...actions };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
