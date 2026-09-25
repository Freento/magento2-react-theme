export const initialCartState = {
  cartId: null,
  cartData: null,
  cartInitialized: false,
  isMiniCartOpen: false,
  loading: false,
  merging: false,
  error: null,
  pendingItems: new Set(),
  lastRemoved: null,
};

export const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART_ID':
      return { ...state, cartId: action.payload };
    case 'SET_CART_INITIALIZED':
      return { ...state, cartInitialized: true };
    case 'SET_CART_DATA':
      return { ...state, cartData: action.payload };
    case 'SET_IS_MINI_CART_OPEN':
      return { ...state, isMiniCartOpen: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_MERGING':
      return { ...state, merging: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_PENDING_ITEM': {
      const next = new Set(state.pendingItems);
      next.add(action.payload);
      return { ...state, pendingItems: next };
    }
    case 'REMOVE_PENDING_ITEM': {
      const next = new Set(state.pendingItems);
      next.delete(action.payload);
      return { ...state, pendingItems: next };
    }
    case 'SET_LAST_REMOVED':
      return { ...state, lastRemoved: action.payload };
    default:
      return state;
  }
};
