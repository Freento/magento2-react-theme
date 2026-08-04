export const initialAuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  initialLoading: true,
  error: null,
  success: null,
  isLoginModalOpen: false,
  isRegisterModalOpen: false,
  isForgotModalOpen: false,
};

export const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: !!action.payload };
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_INITIAL_LOADING':
      return { ...state, initialLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SUCCESS':
      return { ...state, success: action.payload };
    case 'SET_LOGIN_MODAL':
      return { ...state, isLoginModalOpen: action.payload };
    case 'SET_REGISTER_MODAL':
      return { ...state, isRegisterModalOpen: action.payload };
    case 'SET_FORGOT_MODAL':
      return { ...state, isForgotModalOpen: action.payload };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        initialLoading: false,
        isLoginModalOpen: false,
        isRegisterModalOpen: false,
        isForgotModalOpen: false,
      };
    default:
      return state;
  }
};
