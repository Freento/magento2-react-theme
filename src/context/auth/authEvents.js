export const AUTH_EVENTS = {
  LOGOUT: 'auth:logout',
  TOKEN_VALIDATED: 'auth:token_validated',
  TOKEN_INVALID: 'auth:token_invalid',
};

export const dispatchAuthEvent = (eventType, data = null) => {
  const event = new CustomEvent(eventType, { detail: data });
  window.dispatchEvent(event);
};
