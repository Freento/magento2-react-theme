export const mapLoginError = (error) => {
  const gql = error?.graphQLErrors?.[0]?.message;
  if (gql) return gql;

  const raw = error?.message || '';
  if (/Received status code 401/i.test(raw) || /401/.test(raw)) {
    return 'Invalid email or password.';
  }
  if (/Received status code 5\d{2}/i.test(raw)) {
    return 'Server error. Please try again in a moment.';
  }
  if (/Failed to fetch|NetworkError/i.test(raw)) {
    return 'Network error. Check your connection and try again.';
  }
  return raw || 'Sign in failed';
};
