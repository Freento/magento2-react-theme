import { EDITOR_BASE } from '../buildId.js';

export default {
  clientRouting: true,
  hydrationCanBeAborted: true,
  baseServer: '/',
  baseAssets: EDITOR_BASE,
  passToClient: ['pageProps', 'routeParams', 'data'],
  meta: {
    serverRender: {
      env: { server: true, client: true },
    },
  },
};
