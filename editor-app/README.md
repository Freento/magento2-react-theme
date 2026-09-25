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

   function CmsPage({ page }) {
     const devices = useActiveDevices()
     return page ? renderPage(page, { devices }) : null
   }
   ```
   In this repo the host reads the JSON on the server and ships it in the
   rendered document, so a content page costs no extra request; `/api/render`
   is there for hosts that would rather fetch.
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

A block that needs the host's data layer — here `ProductsCarousel` and
`NewsletterForm`, both hitting Magento via Apollo — ships inside
`editor-core` as an inert placeholder. The real component lives in the host
and is wired in through the renderer's `blocks` override:

```js
import { renderPage } from 'editor-core/renderer'
import * as defaultBlocks from 'editor-core/blocks'
import ProductsCarousel from '../components/catalog/ProductsCarousel'

const blocks = { ...defaultBlocks, ProductsCarousel }
renderPage(page, { devices, blocks })
```

The editor's canvas and its preview iframe do the same —
`pages/editor/lib/hostBlocks.jsx` and `pages/__preview__/+Page.jsx` lazily
import through the `@host` Vite alias (see `editor-app/vite.config.js`) and
pass the result as a `blocks` override, so authors see live data inside the
`<ApolloProvider>` that `PreviewChrome.jsx` mounts.

Blocks that need nothing from the host — `HeroSlider`, the content and
layout ones — live only in `editor-core` and render identically in both
places.

### Conditional fields

A `propsSchema` entry may carry `showWhen: { prop, equals }` and the inspector
renders it only while that prop holds that value. `ProductsCarousel` uses it:
the source switch decides whether the panel asks for a category or for a list
of SKUs, so the author is never asked to fill in the one that is ignored.

### Box

`Box` is the container primitive: it holds blocks and takes everything about
how it looks from the style layer every block already has — colour,
background image, a scrim to darken it, padding, corners, size, and a link
wrapping the whole thing. A promo tile is a `Box` with a background image
and a scrim over it; a coloured panel is the same `Box` without the image.
Its own props cover only the stacking: direction, gap and alignment.

The call to action inside such a box is a `Text` block styled as a pill
rather than a `Button` — the box is already an anchor, and anchors cannot
nest.

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
│   └── RoutePreview.jsx           # mounts the host's own page around an area
├── src/styles/editor-tailwind.css # Tailwind entry + editor tokens (--e-*)
├── src/styles/editor-remnants.css # plain-CSS remnants (form bases, cascades)
├── packages/editor-core/          # shared package — npm workspace
│   ├── package.json               # "name": "editor-core"
│   ├── renderer.jsx               # renderPage() + useActiveDevices()
│   ├── registry.js                # block catalog (labels, props schemas)
│   ├── registry-runtime.js        # slim runtime metadata for renderer
│   ├── routes.js                  # route-area vocabulary (areas, display modes)
│   └── blocks/
│       ├── Grid, Box                                 — layout
│       ├── Heading, Text, Image, Icon, Button, Html  — content
│       └── HeroSlider, ProductsCarousel,             — domain
│           NewsletterForm, ContactForm
├── content/pages/*.json           # persisted page definitions (the CMS)
├── content/routes/<type>/*.json   # blocks placed on storefront-owned routes
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
| GET    | `/api/editor/routes`        |                                         | `[{id,title,path,routeType}]` |
| GET    | `/api/editor/routes/:type/:id` |                                      | full route JSON      |
| POST   | `/api/editor/routes`        | `{path, title, route:{type,id}}`        | created document     |
| PUT    | `/api/editor/routes/:type/:id` | full route JSON                      | `{ok:true}`          |
| DELETE | `/api/editor/routes/:type/:id` |                                      | `{ok:true}`          |
| POST   | `/api/editor/upload`        | `multipart/form-data` field `file`      | `{url:"/uploads/…"}` |
| GET    | `/api/editor/push/status`   |                                         | `{canPush,dirty,ahead}` |
| POST   | `/api/editor/push`          |                                         | `{ok:true}`          |
| GET    | `/api/editor/version`       |                                         | `{version,startedAt}` |
| GET    | `/api/render?path=/foo`     |                                         | `{page: {...}}`      |

Page ids are derived from URL path (`/blog/hello` → `blog-hello`). A route
document is filed under its type, so its id is `<type>/<slug>`
(`/gear.html` → `category/gear`) — which is also where it sits on disk. Each
segment must match `[a-zA-Z0-9_-]`.

Every `PUT` writes the file and commits it, with a message describing what
changed (`Gear: added Box`). Uploads are AVIF/WebP only, 10 MB max.

## Route documents

A page the host owns — a category listing, say — cannot be replaced by a
JSON page, but it can take blocks. `content/routes/<type>/<slug>.json` says
which blocks go into which named area of such a route, and what the host's
own content does next to them. One subdirectory per route type, so
`routes/category/gear.json`:

```json
{
  "title": "Gear",
  "path": "/gear.html",
  "route": { "type": "category", "id": 3 },
  "display": "blocks",
  "areas": { "category-top": [ /* blocks */ ] }
}
```

The vocabulary — which areas a route type has, which display modes exist —
lives in `packages/editor-core/routes.js`, so the host and the editor read
it from one place. Adding an area is a line there.

`display` starts at `DEFAULT_DISPLAY_MODE`, the mode that shows blocks —
adding one is what the document is for. The author picks the right mode in
**Settings**, which is also where the page's own settings live: selecting a
block replaces them with the block inspector, and the row above it goes
back.

Authors open one with **Storefront page by URL** in the page picker: the
editor asks the shop what lives at that address (in this repo, Magento's
`route()` through the host's `/graphql`) and creates the document on first
use. `RoutePreview.jsx` then mounts the host's real page component around
the area, so the preview shows live data; only the area is interactive.

## Content sync

Editor writes to `editor-app/content/pages/*.json`. For production,
either:

- mount the same directory into the host container, or
- have the host fetch via `/api/render` when needed (and cache), or
- bake a build step that copies pages into the host before deploy.

Uploads live in `public/uploads/` and are served by the editor server — host
apps either proxy `/uploads/*` to the editor or mirror the directory.

On every save the editor posts a `BroadcastChannel('editor:pages')` message
(`{ type: 'saved', id, path, kind }`) so any host tab listening can drop its
cached copy without a manual reload.

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
