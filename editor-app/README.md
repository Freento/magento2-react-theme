# Visual Page Editor

Drag-and-drop page editor (Vike + React + Vite) that produces JSON page
definitions. The renderer + block catalog live in a self-contained npm
workspace package (`packages/editor-core/`), so a host storefront can render
the exact same markup the editor shows.

## Integrate into another project

Drop the entire `editor-app/` folder into a project. The editor core
ships inside it — nothing else to copy. Then:

1. **Mark workspaces in the host's root `package.json`:**
   ```json
   {
     "workspaces": [
       "editor-app",
       "editor-app/packages/*"
     ],
     "dependencies": {
       "editor-core": "*"
     }
   }
   ```
2. **Run `npm install`** at the host root — npm symlinks
   `node_modules/editor-core` to `editor-app/packages/editor-core`.
3. **Import from the shared package** in host code:
   ```jsx
   import { renderPage, useActiveDevices } from 'editor-core/renderer'

   function CmsPage({ path }) {
     const [page, setPage] = useState(null)
     useEffect(() => {
       fetch(`/api/render?path=${encodeURIComponent(path)}`)
         .then((r) => r.json())
         .then((d) => setPage(d.page))
     }, [path])
     const devices = useActiveDevices()
     return page ? renderPage(page, { devices }) : null
   }
   ```
4. **Proxy editor endpoints** from your host dev server (so the shop and the
   editor live on one origin). Example Vite proxy for a host on `:5173`:
   ```js
   proxy: {
     '/api/editor':  { target: 'http://localhost:3100', changeOrigin: true },
     '/api/render':  { target: 'http://localhost:3100', changeOrigin: true },
     '/uploads':     { target: 'http://localhost:3100', changeOrigin: true },
     '/editor':      { target: 'http://localhost:3100', changeOrigin: true },
     '/__preview__': { target: 'http://localhost:3100', changeOrigin: true },
     '/_editor':  { target: 'http://localhost:3100', changeOrigin: true, ws: true },
   }
   ```
   `/_editor/*` carries the editor Vite's module URLs / HMR. It's there
   because the editor is configured with `baseAssets: '/_editor/'` so the
   two Vites don't fight over `/src/` or `/@fs/` (see
   `renderer/+config.js`).

### Host-only blocks

A block that needs the host's data layer (here: `ProductsCarousel`, hitting
Magento via Apollo) ships inside `editor-core` as an inert placeholder.
The real, GraphQL-backed component lives in the host and is wired in
through the renderer's `blocks` override:

```js
import { renderPage } from 'editor-core/renderer'
import * as defaultBlocks from 'editor-core/blocks'
import ProductsCarousel from '../components/ProductsCarousel'

const blocks = { ...defaultBlocks, ProductsCarousel }
renderPage(page, { devices, blocks })
```

The editor's preview iframe does the same — `pages/__preview__/+Page.jsx`
and `pages/editor/+Page.jsx` lazily `import('@host/components/ProductsCarousel')`
(via the `@host` Vite alias in `editor-app/vite.config.js`) and pass it as a
`blocks` override, so authors see live data inside `<ApolloProvider>`
mounted by `PreviewChrome.jsx`.

## Quick start (standalone)

```bash
cd editor-app
npm install
npm run dev        # http://localhost:3100
```

Default port `3100` (change with `PORT=4000 npm run dev`).

- `/editor` — authoring UI
- `/__preview__` — iframe used by the editor for tablet/mobile preview
- `/api/editor/*` — CRUD + upload HTTP API
- `/api/render?path=/foo` — returns the saved JSON for a given page path

## Layout

```
editor-app/
├── server.js                      # express + Vike SSR + file-based CMS API
├── vite.config.js                 # `@host` alias → <workspace>/src
├── renderer/                      # Vike shell (PageShell, onRenderHtml, …)
│   └── +config.js                 # baseServer:'/', baseAssets:'/_editor/'
├── pages/
│   ├── editor/+Page.jsx           # main editor UI
│   └── __preview__/+Page.jsx      # preview iframe target
├── src/editor/
│   ├── Icon.jsx                   # lucide icons used by editor UI
│   ├── PreviewChrome.jsx          # loads host Header/Footer + providers
│   ├── previewChrome.css
│   └── editor.css                 # editor UI styles (scoped to .editor-root)
├── packages/editor-core/          # shared package — npm workspace
│   ├── package.json               # "name": "editor-core"
│   ├── renderer.jsx               # renderPage() + useActiveDevices()
│   ├── registry.js                # block catalog (labels, props schemas)
│   ├── registry-runtime.js        # slim runtime metadata for renderer
│   └── blocks/
│       ├── Row, Column, Section, Grid                — layout
│       ├── Heading, Text, Image, Button, Html        — content
│       └── NavBar, HeroSlider, ProductsCarousel      — domain
├── content/pages/*.json           # persisted page definitions (the CMS)
└── public/uploads/                # user-uploaded images
```

## HTTP API

All editor state is files on disk — trivial to back up / commit / diff.

| Method | Path                        | Body                                    | Returns              |
|--------|-----------------------------|-----------------------------------------|----------------------|
| GET    | `/api/editor/pages`         |                                         | `[{id,title,path}]`  |
| GET    | `/api/editor/pages/:id`     |                                         | full page JSON       |
| POST   | `/api/editor/pages`         | `{title, path}`                         | created page meta    |
| PUT    | `/api/editor/pages/:id`     | full page JSON                          | `{ok:true}`          |
| DELETE | `/api/editor/pages/:id`     |                                         | `{ok:true}`          |
| POST   | `/api/editor/upload`        | `multipart/form-data` field `file`      | `{url:"/uploads/…"}` |
| GET    | `/api/render?path=/foo`     |                                         | `{page: {...}}`      |

Page ids are derived from URL path (`/blog/hello` → `blog-hello`). Only
`[a-zA-Z0-9_-]` ids are accepted server-side.

## Content sync

Editor writes to `editor-app/content/pages/*.json`. For production,
either:

- mount the same directory into the host container, or
- have the host fetch via `/api/render` when needed (and cache), or
- bake a build step that copies pages into the host before deploy.

Uploads live in `public/uploads/` and are served by the editor server — host
apps either proxy `/uploads/*` to the editor or mirror the directory.

On every save the editor posts a `BroadcastChannel('editor:pages')` message
(`{ type: 'saved', id, path }`) so any host tab listening can refetch the
page without a manual reload.

## Configuration

Environment variables:

- `PORT` — editor server port (default `3100`)
- `NODE_ENV=production` + `npm run build` + `npm start` for prod

## Scripts

```bash
npm run dev        # dev server (file watch)
npm run build      # production build → dist/
npm start          # serve dist/ (prod)
npm run preview    # build + start
```

## Notes

- Editor pages are fully client-rendered (`serverRender: false`). The server
  only provides the API + Vite middleware.
- DnD relies on HTML5 native drag events — no external DnD library.
- `html2canvas` powers the color-picker's pixel sampling.
- Responsive editing stores overrides on `block.responsive[device].{props,style}`.
  `renderer.jsx` merges base + tablet + mobile in the right order.
- When in doubt about a block's config, open `packages/editor-core/registry.js` —
  every field shown in the inspector is declared there.
- Vite HMR is disabled (the editor is an authoring tool, not a live-reload
  dev app). It runs behind the host's `/_editor/` proxy when used
  together with a shop storefront.
