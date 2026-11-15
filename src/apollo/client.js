import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { stripIgnoredCharacters } from 'graphql';
import { readCustomerToken, clearCustomerToken } from '../lib/customerToken';
import { mediaLink } from './mediaLink';

const isServer = typeof window === 'undefined';

// Minify the printed query before it goes on the wire. GraphQL treats whitespace/newlines/commas as insignificant
// except as token separators, so stripIgnoredCharacters drops all the pretty-print indentation (%20/%0A bulk
// in GET URLs) and keeps only the required single spaces.
const minifiedQueryCache = new WeakMap();
export const minifyPrint = (ast, originalPrint) => {
  let out = minifiedQueryCache.get(ast);
  if (out === undefined) {
    out = stripIgnoredCharacters(originalPrint(ast));
    minifiedQueryCache.set(ast, out);
  }
  return out;
};

const authLink = setContext((_, { headers }) => {
  if (isServer) return { headers };
  const token = readCustomerToken();
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {})
    }
  };
});

let tokenCleared = false;
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (isServer) return;
  const isAuthExpired = (msg = '') =>
    /Consumer key has expired/i.test(msg) ||
    /isn'?t authorized/i.test(msg) ||
    /current customer/i.test(msg);

  const gqlAuthErr = graphQLErrors?.some(
    (e) => e?.extensions?.category === 'graphql-authentication' || isAuthExpired(e?.message)
  );
  const isHttp401 = networkError && networkError.statusCode === 401;
  if (!gqlAuthErr && !isHttp401) return;

  if (tokenCleared) return; // suppress the cascade of follow-up 401s
  tokenCleared = true;
  clearCustomerToken();
  // Reset the latch after a tick so future genuine expirations are caught.
  setTimeout(() => { tokenCleared = false; }, 2000);
  window.dispatchEvent(new CustomEvent('auth:token-expired'));
});

function resolveServerUri() {
  const origin = process.env.GRAPHQL_ORIGIN;
  if (!origin) {
    throw new Error('GRAPHQL_ORIGIN is not set — add it to .env (see .env.example)');
  }
  const pathFromClient = process.env.VITE_GRAPHQL_URL || '/graphql';
  // If VITE_GRAPHQL_URL is absolute, use it as-is on the server too.
  if (/^https?:\/\//i.test(pathFromClient)) return pathFromClient;
  return `${origin.replace(/\/$/, '')}${pathFromClient}`;
}

function resolveClientUri() {
  const fromViteEnv =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_GRAPHQL_URL
      : undefined;
  return fromViteEnv || '/graphql';
}

function createHttpLinkForEnv() {
  // useGETForQueries: send queries via GET so Magento/Varnish FPC can cache the cacheable ones (catalog, CMS).
  // Mutations stay POST automatically.
  if (isServer) {
    // Node 18+ has global fetch — hit the origin directly during SSR.
    return createHttpLink({ uri: resolveServerUri(), useGETForQueries: true, print: minifyPrint });
  }

  return createHttpLink({ uri: resolveClientUri(), useGETForQueries: true, print: minifyPrint });
}

// Cart items are an interface; without this Apollo cannot match a fragment
// defined `on CartItemInterface` to a concrete item and silently drops its
// fields when writing to the cache. Shared with the SSR client in entry-server.
export const possibleTypes = {
  CartItemInterface: [
    'SimpleCartItem',
    'VirtualCartItem',
    'DownloadableCartItem',
    'BundleCartItem',
    'ConfigurableCartItem',
    'GiftCardCartItem',
  ],
};

/**
 * The one cache configuration, shared by the browser client and the SSR render in
 * entry-server.jsx. The two must agree: without the `Query.customer` merge the
 * server lets each customer query replace the others' fields, so it refetches
 * `getCustomer` on every render pass and ships a cache the browser then has to
 * fill in again.
 */
export function makeApolloCache() {
  return new InMemoryCache({
    possibleTypes,
    typePolicies: {
      // The signed-in customer is one per session (signing out reloads the page),
      // so every Customer object is the same cache entry, whatever fields its
      // query asked for. Without a key it was stored inline under
      // Query.customer, and a refetch of any customer query — which overwrites
      // rather than merges — dropped the fields the other queries had loaded.
      Customer: { keyFields: [] },
      StoreConfig: { keyFields: [] },
      CompareList: { keyFields: ['uid'] },
      Query: {
        fields: {
          customer: {
            merge: (existing, incoming, { mergeObjects }) =>
              mergeObjects(existing, incoming),
          },
        },
      },
      PriceRange: {
        keyFields: false,
        merge: (existing, incoming, { mergeObjects }) =>
          mergeObjects(existing, incoming),
      },
      ProductPrice: {
        keyFields: false,
        merge: (existing, incoming, { mergeObjects }) =>
          mergeObjects(existing, incoming),
      },
      ProductImage: {
        keyFields: false,
        merge: (existing, incoming, { mergeObjects }) =>
          mergeObjects(existing, incoming),
      },
      CartPrices: {
        keyFields: false,
        merge: (existing, incoming, { mergeObjects }) =>
          mergeObjects(existing, incoming),
      },
      Cart: {
        fields: {
          prices: {
            merge: (existing, incoming, { mergeObjects }) =>
              mergeObjects(existing, incoming),
          },
          items: {
            merge: false,
          },
        },
      },
    },
  });
}

export function makeApolloClient({ ssr = false, initialCache = null } = {}) {
  const cache = makeApolloCache();
  if (initialCache) cache.restore(initialCache);
  return new ApolloClient({
    ssrMode: ssr,
    link: errorLink.concat(authLink).concat(mediaLink).concat(createHttpLinkForEnv()),
    cache,
    defaultOptions: {
      watchQuery: { fetchPolicy: 'cache-and-network' }
    }
  });
}

let clientSingleton = null;

export function getClientApolloClient(initialCache = null) {
  if (isServer) return makeApolloClient({ ssr: false, initialCache });
  if (!clientSingleton) {
    clientSingleton = makeApolloClient({ ssr: false, initialCache });
  } else if (initialCache) {
    clientSingleton.cache.restore(initialCache);
  }
  return clientSingleton;
}
