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
   `/_editor/*` carries the editor's asset URLs, and its Vite module URLs in
   dev. It exists so the two Vites don't fight over `/src/` or `/@fs/`: the
   editor builds under that prefix — `/_editor/<BUILD_ID>/` in dev, a fixed
   `/_editor/` in production (see `buildId.js`, wired through `base` in
   `vite.config.js`). The dev id is minted per process, so a restart never
   serves module URLs of a process that is gone. The production prefix carries
   no id on purpose: built filenames already carry a content hash, and a prefix
   that changed per process would strand every asset URL the moment the server
   restarted.

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

### System blocks

A block whose definition carries `system: true` (`NewsletterForm`,
`ContactForm`) is a built-in component. Authors can open it and change its
settings, and move it within its own document, but the editor never offers it
in the catalog and hides Duplicate/Delete for it and for any container or grid
cell that holds it. It cannot be dragged between the page and the footer. A
page holding one can be hidden but not deleted, and duplicating such a page
leaves the system block out of the copy.

`server.js` enforces the same rules on the API, so they do not depend on the
UI. To place a system block, a developer adds it to the JSON in
`content/pages/` or `content/routes/` and commits.

### Conditional fields

A `propsSchema` entry may carry `showIf(props)` and the inspector renders it
only while the function returns true for the block's resolved props.
`ProductsCarousel` uses it: the source switch decides whether the panel asks
for a category or for a list of SKUs, so the author is never asked to fill in
the one that is ignored. `label` and `options` may be functions of the props
too.

Style-layer fields marked `containerOnly` (the background image) appear only on
blocks that accept children.

### Column

`Column` is the container primitive: it holds blocks and takes everything about
how it looks from the style layer every block already has — colour,
background image, a scrim to darken it, padding, corners, size, and a link
wrapping the whole thing. A promo tile is a `Column` with a background image
and a scrim over it; a coloured panel is the same `Column` without the image.
Its own props cover only the stacking: direction, gap and alignment. It lives
only inside a `Grid`, where it is the cell: a block dropped into a grid is
wrapped in one, and a tile standing alone is a one-column grid.

The call to action inside such a tile is a `Text` block styled as a pill
rather than a `Button` — the tile is already an anchor, and anchors cannot
nest.

## Quick start (standalone)

```bash
cd editor-app
npm install
npm run dev        # http://127.0.0.1:3100 (EDITOR_PORT)
```

Default port `3100` (set `EDITOR_PORT` in the host's root `.env`, or
`EDITOR_PORT=4000 npm run dev`). The server binds to loopback — the host
storefront proxies `/editor` from the same machine (in Docker, from the same
container). `EDITOR_HOST` opens it wider, which is only wanted when the host
genuinely runs elsewhere.

- `/editor` — authoring UI
- `/__preview__` — iframe used by the editor for tablet/mobile preview
- `/api/editor/*` — CRUD + upload HTTP API
- `/api/render?path=/foo` — returns the saved JSON for a given page path

## Layout

```
editor-app/
├── server.js                      # express + Vike SSR + file-based CMS API; vite (dev) / dist (prod)
├── buildId.js                     # build id + the '/_editor/' bases (dev/prod)
├── vite.config.js                 # `@host` alias → <workspace>/src; base per mode
├── renderer/                      # Vike shell (PageShell, onRenderHtml, …)
│   └── +config.js                 # baseServer:'/' (baseAssets comes from vite `base`)
├── pages/
│   ├── editor/+Page.jsx           # main editor UI
│   └── __preview__/+Page.jsx      # preview iframe target
├── src/editor/
│   ├── Icon.jsx                   # lucide icons used by editor UI
│   ├── PreviewChrome.jsx          # loads host Header/Footer + providers
│   ├── MobileUnavailable.jsx      # placeholder on touch devices / windows < 1024px
│   └── RoutePreview.jsx           # mounts the host's own page around an area
├── src/styles/editor.css          # plain-CSS remainder (ed-* tokens live in tailwind.config.js)
├── pages/editor/lib/areas.js      # the regions edited at once (page + global blocks)
├── pages/editor/lib/pendingUploads.js # picked images stay in the browser until Save
├── packages/editor-core/          # shared package — npm workspace
│   ├── package.json               # "name": "editor-core"
│   ├── renderer.jsx               # renderPage() + useActiveDevices()
│   ├── registry.js                # block catalog (labels, props schemas)
│   ├── registry-runtime.js        # slim runtime metadata for renderer
│   ├── routes.js                  # route-area vocabulary (areas, display modes)
│   ├── lib/richText.js            # sanitiser for the on-page text toolbar
│   ├── lib/customCss.js           # allowlist validator for "Custom styles"
│   ├── lib/responsiveCss.js       # per-device grid stylesheet for SSR markup
│   └── blocks/
│       ├── Grid, Column                              — layout
│       ├── Text, Image, Button, Html                 — content
│       ├── Heading                                   — deprecated, still renders
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
| GET    | `/api/editor/pages`         |                                         | `[{id,title,path,hidden}]` |
| GET    | `/api/editor/pages/:id`     |                                         | full page JSON       |
| POST   | `/api/editor/pages`         | `{title, path}`                         | created page meta    |
| PUT    | `/api/editor/pages/:id`     | full page JSON                          | `{ok:true}`          |
| PATCH  | `/api/editor/pages/:id`     | `{title?, path?, hidden?}`              | updated page meta    |
| POST   | `/api/editor/pages/:id/duplicate` | `{title, path}`                   | created page meta    |
| DELETE | `/api/editor/pages/:id`     |                                         | `{ok:true}`          |
| GET    | `/api/editor/routes`        |                                         | `[{id,title,path,routeType}]` |
| GET    | `/api/editor/routes/:type/:id` |                                      | full route JSON      |
| POST   | `/api/editor/routes`        | `{path, title, route:{type,id}}`        | created document     |
| PUT    | `/api/editor/routes/:type/:id` | full route JSON                      | `{ok:true}`          |
| DELETE | `/api/editor/routes/:type/:id` |                                      | `{ok:true}`          |
| POST   | `/api/editor/upload`        | `multipart/form-data` field `file`      | `{url:"/uploads/…"}` |
| GET    | `/api/editor/push/status`   |                                         | `{canPush,dirty,ahead,commits}` |
| POST   | `/api/editor/push`          |                                         | `{ok:true}`          |
| GET    | `/api/editor/site-settings` |                                         | `{maintenance:{enabled,allowedIps}}` |
| PUT    | `/api/editor/site-settings` | `{maintenance:{enabled,allowedIps}}`    | saved settings       |
| GET    | `/api/editor/config`        |                                         | `{save:{disabled,tooltip}}` |
| GET    | `/api/editor/version`       |                                         | `{version,startedAt}` |
| GET    | `/api/render?path=/foo`     |                                         | `{page: {...}}`      |

Page ids are derived from URL path (`/blog/hello` → `blog-hello`). A route
document is filed under its type, so its id is `<type>/<slug>`
(`/gear.html` → `category/gear`) — which is also where it sits on disk. Each
segment must match `[a-zA-Z0-9_-]`.

Every `PUT` writes the file and commits it, with a message describing what
changed (`Gear: added Column`), together with every `/uploads/` file the document
refers to. Uploads are AVIF/WebP only, 10 MB max. A picked image stays in the
browser as a `blob:` URL until Save, which uploads it first and rewrites the
URL, so an abandoned edit never leaves a file on the server.

Page-level operations — create, `PATCH` (title / path / `hidden`), duplicate
and delete — commit *and* publish on their own, because they are single
deliberate acts rather than a stream of block edits. Each returns
`{committed, published, publishError}` so a change that was written and
committed but could not be published says exactly that. Every commit carries a
pathspec, so unrelated staged work in the checkout never rides along.

`PATCH` keeps the page's file name (its id), so renaming a page or moving it to
another path keeps it in one file with one git history. The prerendered
document, which is named after the *path*, is rebuilt under the new one.
Duplicating copies blocks, page style and device overrides as they are and
mints fresh block ids.

A page with `"hidden": true` stays fully editable but leaves the storefront
entirely: `/api/render` answers 404, and `server.dev.js`, `server.prod.js` and
`scripts/prerender.js` all skip it, so its URL behaves exactly like one that
was never created (no route, no prerendered document, not-found instead).

With `SAVE_BUTTON=disabled` (a demo instance) every page operation and the
creation and deletion of route documents are refused with 403 alongside Save
and Push, and the picker greys the controls out with `SAVE_BUTTON_TOOLTIP`.

`version` identifies the assets the browser is currently running: the
per-process id in dev, the build's own stamp (mtime of `dist/server/entry.mjs`)
in production. The authoring UI polls it and reloads itself once it changes and
nothing is left unsaved — so a rebuild reaches open tabs without restarting the
server.

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

Pages live in `content/pages/*.json`, uploads in `public/uploads/`. Each is the
single copy of that data — nothing is mirrored into a build output, so a saved
page and a fresh upload are live immediately. In this repo the host storefront
reads the page directory on every request and serves `/uploads/*` straight from
the upload directory.

A host that cannot share a filesystem with the editor can instead:

- mount the same two directories into the host container, or
- fetch pages via `/api/render` when needed (and cache), or
- copy them into the host as a build step before deploy.

On every save the editor posts a `BroadcastChannel('editor:pages')` message
(`{ type: 'saved', id, path, kind }`) so any host tab listening can drop its
cached copy without a manual reload.

## Configuration

Read from the host's root `.env` (`../.env`) — the editor has no `.env` of its
own:

- `EDITOR_PORT` — editor server port (default `3100`)
- `EDITOR_HOST` — interface to bind (default `127.0.0.1`)
- `EDITOR_MODE` — `dev` serves from source through Vite, `prod` serves `dist/`
  (the host's `scripts/start.js` maps it to `NODE_ENV`)
- `EDITOR_AUTH_*` — Basic Auth for the editor routes. Enforced by the host
  server ahead of its proxy, so an unauthorised request never reaches this
  process
- `EDITOR_ADMIN_AUTH_*` — sign-in with a Magento admin account that has access
  to CMS pages (`server/editorAuth.js` in the host), with the Google
  Authenticator code when `Magento_TwoFactorAuth` is on. The host passes the
  admin to this process in `x-editor-user`, and every commit the editor makes
  ends with `Editor-User: #<admin id> <username>`
- `SAVE_BUTTON=disabled` / `SAVE_BUTTON_TOOLTIP` — read-only demo instance
- `EDITOR_LOG_FILE` — where errors are written (default `var/log/editor.log` at
  the repo root, rotated to `.1` at 5 MB). The server writes there whatever it
  fails to do: a save it refuses or cannot write to disk, a rejected upload,
  git commit, pull and push failures, the storefront notify, SSR errors,
  exceptions in API handlers and unhandled rejections, each with a timestamp

### Maintenance mode

The toolbar's Site settings dialog switches the storefront to the
`/__maintenance__` page (an ordinary editor page, so its content is authored
like any other) and lists the IP addresses that still see the site. The switch
lives in `var/site-settings.json`, which is not in git: it must never travel to
another environment with a content push. `npm run maintenance:on` and
`npm run maintenance:off` at the root flip it from the shell. The storefront
answers 503 with the page while it is on.

## Editing

- Text is edited on the page. Selecting text shows a toolbar with bold,
  italic, underline, strikethrough, heading level, size, link, bullet and
  numbered lists; the result is sanitised by `lib/richText.js`. Headings are
  Text blocks with a level, so the Heading block is hidden from the catalog.
- Link fields suggest site pages, products and categories as you type.
- Blocks are placed by dragging only; a click in the catalog inserts nothing.
  Images and plain text dragged from the desktop land as Image and Text
  blocks. Ctrl/Cmd+C, X and V copy, cut and paste the selected block, also
  across pages and tabs.
- Grid columns and rows have 1–5 presets with a pencil for any other number;
  margins, padding and gap sit in the main group. Alignment, font, radius and
  border on containers gave way to a "Custom styles" textarea with an
  allowlist validator and an Apply button.
- With tablet or mobile selected, fields that change only on that screen carry
  a badge; the rest apply to every screen.
- A click on a block's name badge selects its parent; the Locate button in the
  settings header scrolls the page to the block.
- Colour fields accept any CSS colour format. Pages can be searched, sorted
  and opened on the storefront from the page picker.
- Save shows its steps (upload, save and commit, publish) on hover, with
  Retry when one fails.

## Scripts

```bash
npm run dev        # dev server (file watch)
npm run build      # production build → dist/ (also `npm run build:editor` at the root)
npm start          # serve dist/ (NODE_ENV=production; exits if there is no build)
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
  together with a shop storefront. `EDITOR_MODE=prod` runs without Vite at all.
