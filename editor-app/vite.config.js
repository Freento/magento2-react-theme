import { defineConfig, transformWithEsbuild, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import vike from 'vike/plugin';
import path from 'path';
import { fileURLToPath } from 'node:url';

import { EDITOR_BASE, EDITOR_BASE_PROD } from './buildId.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOST_ROOT = path.resolve(__dirname, '..');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(process.cwd(), '..'), '');

  const hmrConfig = env.PUBLIC_HOST
    ? { host: env.PUBLIC_HOST, protocol: 'wss', clientPort: Number(env.PUBLIC_PORT) }
    : {};

  return {
    // Dev gets the per-process base (cache-busting), the build gets the fixed
    // one - see buildId.js for why the id must not end up in a built URL.
    base: mode === 'production' ? EDITOR_BASE_PROD : EDITOR_BASE,
    plugins: [
      {
        name: 'load-js-as-jsx',
        enforce: 'pre',
        async transform(code, id) {
          if (!/src\/.*\.js$/.test(id)) return null;
          return transformWithEsbuild(code, id, {
            loader: 'jsx',
            jsx: 'automatic',
          });
        },
      },
      react(),
      vike(),
    ],
    optimizeDeps: {
      esbuildOptions: {
        loader: { '.js': 'jsx' },
      },
      include: ['@apollo/client', 'react-router-dom', 'graphql'],
    },
    ssr: {
      noExternal: ['@apollo/client', 'editor-core'],
    },
    resolve: {
      dedupe: ['react', 'react-dom', '@apollo/client', 'react-router-dom'],
      alias: {
        '@host': path.join(HOST_ROOT, 'src'),
      },
    },
    server: {
      fs: {
        allow: ['.', '..'],
      },
      hmr: hmrConfig,
      allowedHosts: ['editor-react-app', ...(env.PUBLIC_HOST ? [env.PUBLIC_HOST] : [])],
    },
  };
});
