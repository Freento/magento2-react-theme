# Freento React Theme for Magento 2

## Can Magento be fast?

It can. Magento's problem is not the platform itself, but the way its classic frontend works: slow server responses whenever a page misses the Full Page Cache, an FPC that requires very careful tuning and constant attention to cache invalidation, lots of heavy AJAX calls loading page sections, and images in outdated formats. We removed all of that and built a React storefront where every detail is engineered for speed. Our goal is near-instant navigation to every subsequent page.

It is also extremely hard to get close to a 100 Core Web Vitals score in Google PageSpeed Insights with the native Magento theme. Even a Performance score of 70 is often out of reach on mobile devices, and many Magento stores sit below 50. Here you get 100 out of the box, and even with deep theme customizations the score stays at 90+.

Why is this theme faster than Venia and similar themes? Because they don't make performance their primary goal. Venia issues 10+ requests to load page content, which puts load on the server and slows page delivery, especially on mobile connections. We optimize the theme to achieve the best possible results.

Below is exactly what the theme does and why it delivers.

---

## Live demo

See the theme running on a real Magento 2 store:

- **Storefront:** [react-m2-theme.freento.com](https://react-m2-theme.freento.com/)
- **Editor:** [react-m2-theme.freento.com/editor](https://react-m2-theme.freento.com/editor) — open to everyone. You can add, move, and edit blocks freely; saving is switched off, so nothing you do changes the demo.

The same theme with a different look — each of these is built in the editor from the same set of blocks:

- [Alternative design 1](https://react-m2-theme-alt1.freento.com/)
- [Alternative design 2](https://react-m2-theme-alt2.freento.com/)
- [Alternative design 3](https://react-m2-theme-alt3.freento.com/)

---

## What makes the theme fast

### One GraphQL request per page

Each page issues at most one blocking GraphQL request — the one without which the page cannot render. Everything else (menu, filters, reviews, auxiliary data) loads separately or ships built into the theme, and never blocks rendering. The user sees content immediately instead of waiting for the full data payload to assemble.

### Prefetching the next pages

The theme predicts where the user will go next. Hover over a product card or a menu item, and the data for that page already starts loading in the background. The click-through is instant because the response is already in the cache. On mobile, prefetching triggers on touch.

### URL resolution on the backend, then passed as a parameter

A classic GraphQL storefront asks Magento "what is this URL — a product, a category, or a page?" on every navigation, and only then loads the data. That's an extra network round trip for every page.
In our theme the URL is resolved by the backend Node server on the first visit, and for in-site navigation the page type and its id are passed as parameters — no separate URL resolution request is needed at all.

### Direct database queries, bypassing Magento

For operations where every millisecond counts, the theme can connect to the database directly, without bootstrapping the whole of Magento. URL resolution works this way today: a direct query answers in single-digit milliseconds versus ~150 ms through GraphQL. You are free to wire up anything else the same way — for example, to speed up search autocomplete.

### Editor instead of PageBuilder

The theme ships with its own visual content editor as a PageBuilder replacement. It is noticeably more convenient to work with and architecturally faster: page content is stored alongside the storefront and lands directly in the rendered HTML. The extra request to Magento for CMS content disappears entirely.

Bonus: every save in the editor is recorded as a git commit — a complete history of content changes for free.

### Only modern image formats in content

The editor physically won't let you upload a heavy JPEG or PNG — only WebP and AVIF are accepted. Content pages force the content manager to watch the format and upload optimized images.

### Product images recompressed to WebP/AVIF

Catalog images are served in WebP/AVIF — the most compact of the modern formats. The same product listing typically weighs 2–3 times less than with JPEG, which shows up directly in LCP and in your bandwidth bill.

### Brotli compression at build time

All assets (JS, CSS, HTML, fonts) are compressed with Brotli at the maximum compression level during the build. The server serves ready-made `.br` files without spending CPU on on-the-fly compression — maximum compression with zero server load at request time.

### Menu and footer in the server HTML

The menu and the footer arrive with the page as ready-made HTML, and the desktop dropdowns are already in the markup, just hidden until hover. The browser doesn't send a menu request on page load, and opening a dropdown costs nothing. If the menu is not in the server response, it is loaded lazily (on mobile, only when the navigation panel is opened) and the category tree is cached in the browser for 24 hours.

### Server-side rendering (SSR)

The homepage, categories, and content pages arrive from the server as ready-made HTML. Users and search engine crawlers see content from the first byte, with no white screen and no "loading" state. Content pages are additionally prerendered at build time — the server delivers them as static files.

Tablet and mobile settings of editor blocks are written into the HTML as CSS media rules, so a prerendered page already has the right layout on a phone before any JavaScript runs. Product carousels on content pages load in the browser, so a static page never shows stale products or guest prices to a logged-in customer.

### GraphQL over GET requests

Requests to Magento go out as GET, which means they can be cached in Varnish or on a CDN — a repeat request never reaches PHP at all. Combined with Varnish this yields instant page responses. GET-based GraphQL is also much easier to warm with an FPC warmer — in the same amount of time you can warm 5–10 times more pages, because GraphQL responses are significantly faster than regular ones.

### Critical CSS and a late app start

Each page type gets only the CSS it needs inlined into the HTML; the full stylesheet loads without blocking rendering. The application itself starts after the largest image has been painted, so JavaScript doesn't compete with the content the user is waiting for.

### Images that don't fight each other

Only the first image on a category page gets high loading priority; the rest wait until it has loaded. On the product page the gallery thumbnails wait for the main image. The LCP image always gets the full bandwidth.

### Other optimizations: CSS, fonts, caching, and more

Hashed assets are cached in the browser for a year and fonts for a week. Breadcrumbs are rendered on the server, fonts don't trigger a scan of system fonts, and the markup keeps heading order and ARIA attributes in place. Everything is tuned so there is no layout shift and the CWV score is 100 or close to it.

### Fresh code after every deployment

When a new version of the theme is deployed while a visitor has the site open, the page notices that its code is outdated, shows a short notice, and refreshes itself. Nobody is left with a broken tab after a release.

---

## Philosophy: lightweight over universal

The theme deliberately doesn't try to cover every Magento scenario. There is no forest of conditions and templates "for every possible case" — which is exactly why it is fast and easy to understand.

Some functionality that not everyone needs (for example, bundle and grouped products) is not included in the package. This is a conscious decision: such things are easy to code for a specific project — with AI assistance following the patterns of the existing code, or by our team. The codebase is compact and consistent, so AI assistants work with it well.

The main rule for customizations is to keep the bundle size within the defined limits: the theme's speed is not a one-time achievement but a budget we maintain.

---

## How the theme handles Page Builder

Page Builder is the usual stumbling block for headless storefronts. Its content is stored in the Magento database as HTML with service markup, it needs a separate request (which hurts performance), and rendering that markup in a React application is a pain of its own: either insert it "as is" and live with extremely heavy markup that is hard to style, or parse it into something lighter and maintain compatibility with every Page Builder update. On top of that, the editor itself is heavy and sluggish to work with.

We took a different path: the theme ships with its own visual editor built specifically for this theme. It opens at a separate URL, closed to other users. We put a lot of effort into making it genuinely pleasant to work with.

You can try it right now in the [demo editor](https://react-m2-theme.freento.com/editor): editing works, saving is switched off.

### What you can do in it

- **Create new pages quickly.** A new landing or content page comes together in minutes: create the page, drop in blocks, save — and it's already live on the storefront inside the store's real header and footer. No developer, no template edits.
- **Global shared blocks.** A block needed on several pages (footer, promo bar, benefits block, menu) is built once and attached anywhere. Fix it in one place — it changes on all pages at once.
- **Local blocks for a single page.** Everything unique to a specific page lives right inside it and doesn't clutter the shared catalog.
- **Flexible elements in any position.** A page is laid out with grids and sections, and anything can be dragged into any position: an image, a heading, text, a button, an HTML snippet. No rigid "image left, text right" templates.
- **Ready-made widgets.** A slider, a product carousel, and similar large blocks are inserted in one move — and the preview immediately shows live store data: the carousel talks to the same GraphQL as the storefront.
- **Text edited right on the page.** A text toolbar appears over the block itself: heading level, bold, italic, lists, links. When you add a link, the editor suggests pages of the store as you type.
- **Grid presets and copy/paste.** A grid starts from a ready layout, and any block can be copied and pasted to another place or page.
- **Custom styles per device.** Any block can get its own CSS, separately for desktop, tablet, and mobile.
- **Blocks on category pages.** Banners and promo tiles can be placed above the product list of any category, and each category can show blocks, products, or both.
- **Page management.** Pages can be created, duplicated, hidden, and deleted right in the editor; the page list has search and sorting.

### Why it's convenient to work with

- **Real-time preview.** The storefront and the editor render pages with the same code: what the content manager sees while editing is literally the same React components the customer will see.
- **Mobile and tablet modes on the same screen.** Tablet and mobile previews are available right while editing. You can define separate styles for different devices.
- **Drag-and-drop without heavy libraries.** Dragging blocks and cells runs on native browser mechanisms — the editor doesn't pull in extra dependencies.

### What it means for speed

- **Zero content requests.** Page content lives alongside the storefront and lands directly in the HTML during server-side rendering, and content pages are prerendered at build time and served as static files. The "give me the CMS content" request disappears entirely — along with its load on Magento.
- **Content can't ruin performance.** The editor accepts images only in WebP/AVIF, and the block set is limited to the theme's optimized components. A content manager physically cannot insert a heavy slider or a three-megabyte JPEG and tank your PageSpeed score.
- **Header, footer, and menu live in the editor too.** They are the same shared blocks, and they need zero requests to Magento.

### And for content management

- **Change history for free.** Every save and every page operation is a git commit with a clear description of what changed, pushed to the repository right away. You can always see who changed what, and any version of a page can be restored.
- **Content goes live without a build.** The storefront reads saved pages from disk, so a content change needs no rebuild or restart.
- **Safe for demos.** Saving can be switched off for a demo instance: the editor stays open to explore, but nothing can be changed.
- **Content travels with the code.** Pages are files in the repository: they go through the same deployment pipeline as the theme code and move easily between environments (dev → staging → production) without database dumps.
- **The editor is easy to extend.** A new block is a regular React component plus an entry in the block catalog. No need to learn Page Builder internals — a block is written in hours, including with AI assistance following the existing examples.

If a project already has content in Page Builder, it is migrated once: pages are rebuilt in the editor from the available blocks, and from then on the content lives by the new scheme. It's usually quite fast.

### Maintenance mode

The storefront can be closed for maintenance with one switch in the editor or a single command. Visitors get a 503 response with a maintenance page that is edited in the editor like any other page, while the IP addresses you allow keep working with the full store.

---

## How to speed up Magento further

The theme solves the frontend part of the problem. The Magento backend can be accelerated too:

### Varnish warming for GraphQL

Since requests go out as GET, they can be cached in Varnish. Regular cache warming (crawling key categories and products on a schedule) means the first real visitor already gets a response from the cache instead of waiting for PHP. After cache invalidation on reindexing, warming restores full speed within minutes. Warming GraphQL is much faster than warming regular Magento pages — by a factor of 5–10.

### PHP on Swoole

Classic PHP-FPM boots the application from scratch on every request. Swoole keeps Magento permanently loaded in memory: the startup cost disappears, and GraphQL response times drop several-fold.

---

## Magento version compatibility

The theme works with several Magento versions. Blocks that need a newer backend hide themselves quietly on older ones; see [`docs/MAGENTO-COMPATIBILITY.md`](docs/MAGENTO-COMPATIBILITY.md).
