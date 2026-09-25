import { defineConfig, loadEnv, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const serveEditorUploads = () => ({
  name: 'serve-editor-uploads',
  apply: 'serve',
  configureServer(server) {
    const root = path.join(__dirname, 'editor-app/public/uploads');
    if (!fs.existsSync(root)) return;
    server.middlewares.use('/uploads', (req, res, next) => {
      const rel = decodeURIComponent((req.url || '').split('?')[0]);
      const file = path.join(root, rel);
      if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return next();
      const ext = path.extname(file).toLowerCase();
      const type = ext === '.avif' ? 'image/avif'
        : ext === '.webp' ? 'image/webp'
        : ext === '.png' ? 'image/png'
        : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
        : ext === '.svg' ? 'image/svg+xml'
        : 'application/octet-stream';
      res.setHeader('Content-Type', type);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      fs.createReadStream(file).pipe(res);
    });
  },
});

export default defineConfig(({ mode, isSsrBuild }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (!env.GRAPHQL_ORIGIN) {
    throw new Error('GRAPHQL_ORIGIN is not set — add it to .env (see .env.example)');
  }
  const graphqlOrigin = env.GRAPHQL_ORIGIN;
  const graphqlPath = env.VITE_GRAPHQL_URL || '/graphql';
  const graphqlInsecure = String(env.GRAPHQL_INSECURE || '').toLowerCase() === 'true';
  const shouldProxy = !/^https?:\/\//i.test(graphqlPath);

  const magentoProxyTargets = {
    [graphqlPath]:           { target: graphqlOrigin, changeOrigin: true, secure: !graphqlInsecure },
    '/customer/ajax':        { target: graphqlOrigin, changeOrigin: true, secure: !graphqlInsecure },
    '/checkout/index':       { target: graphqlOrigin, changeOrigin: true, secure: !graphqlInsecure },
  };

  const editorEnabled = String(env.EDITOR_ENABLED ?? 'on').toLowerCase() !== 'off';
  const editorTarget = env.EDITOR_APP_URL || 'http://localhost:3100';
  const editorProxyTargets = editorEnabled ? {
    '^/editor(/|$)':      { target: editorTarget, changeOrigin: true, ws: true },
    '^/__preview__(/|$)': { target: editorTarget, changeOrigin: true, ws: true },
    '^/_editor/':         { target: editorTarget, changeOrigin: true },
    '^/api/editor(/|$)':  { target: editorTarget, changeOrigin: true },
    '^/api/render(/|$)':  { target: editorTarget, changeOrigin: true },
  } : {};

  return {
    build: {
      sourcemap: 'hidden',
      ...(isSsrBuild && {
        rollupOptions: { output: { inlineDynamicImports: true } },
      }),
    },
    plugins: [
      {
        name: 'load-js-as-jsx',
        enforce: 'pre',
        async transform(code, id) {
          if (!/src\/.*\.js$/.test(id)) return null;
          return transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' });
        }
      },
      serveEditorUploads(),
      react(),
      // Pre-compress static assets at build time so nginx's brotli_static
      // serves the ready *.br files instead of running brotli on every
      // request (level-11 on-the-fly was ~500ms CPU per JS hit).
      compression({
        algorithm: 'brotliCompress',
        ext: '.br',
        filter: /\.(js|mjs|css|html|json|svg|woff2?|xml)$/i,
        threshold: 1024,
        deleteOriginFile: false,
        compressionOptions: { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } },
      }),
    ],
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-router-dom',
        '@apollo/client',
        '@apollo/client/link/context',
      ],
      esbuildOptions: { loader: { '.js': 'jsx' } }
    },
    ssr: {
      noExternal: ['@apollo/client', 'editor-core']
    },
    server: {
      host: true,
      ...(env.VITE_ALLOWED_HOST ? { allowedHosts: [env.VITE_ALLOWED_HOST] } : {}),
      hmr: { port: 24680 },
      proxy: {
        ...(shouldProxy ? magentoProxyTargets : {
          '/customer/ajax':          magentoProxyTargets['/customer/ajax'],
          '/checkout/index':         magentoProxyTargets['/checkout/index'],
        }),
        ...editorProxyTargets,
      }
    }
  };
});
