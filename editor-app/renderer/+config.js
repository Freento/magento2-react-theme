// No `baseAssets` here on purpose: vike takes it from vite.config.js `base`,
// which is the per-process dev base or the fixed prod one depending on the
// mode (see buildId.js). Setting it here would pin one of them for both.
export default {
  clientRouting: true,
  hydrationCanBeAborted: true,
  baseServer: '/',
  passToClient: ['pageProps', 'routeParams', 'data'],
  meta: {
    serverRender: {
      env: { server: true, client: true },
    },
  },
};
