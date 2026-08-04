# Freento React Theme for Magento 2

## Can Magento be fast?

It can. Magento's problem is not the platform itself, but the way its classic frontend works: slow server responses whenever a page misses the Full Page Cache, an FPC that requires very careful tuning and constant attention to cache invalidation, lots of heavy AJAX calls loading page sections, and images in outdated formats. We removed all of that and built a React storefront where every detail is engineered for speed. Our goal is near-instant navigation to every subsequent page.

It is also extremely hard to get close to a 100 Core Web Vitals score in Google PageSpeed Insights with the native Magento theme. Even a Performance score of 70 is often out of reach on mobile devices, and many Magento stores sit below 50. Here you get 100 out of the box, and even with deep theme customizations the score stays at 90+.

Why is this theme faster than Venia and similar themes? Because they don't make performance their primary goal. Venia issues 10+ requests to load page content, which puts load on the server and slows page delivery, especially on mobile connections. We optimize the theme to achieve the best possible results.

Below is exactly what the theme does and why it delivers.

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

### Menu without a GraphQL request

The menu is either defined in the editor or loaded lazily: on mobile, only when the navigation panel is opened. On top of that, the category tree is cached in the browser for 24 hours. The result: the menu request never affects page rendering, and most of the time it doesn't happen at all.

### Server-side rendering (SSR)

The homepage, categories, and content pages arrive from the server as ready-made HTML. Users and search engine crawlers see content from the first byte, with no white screen and no "loading" state. Content pages are additionally prerendered at build time — the server delivers them as static files.

### GraphQL over GET requests

Requests to Magento go out as GET, which means they can be cached in Varnish or on a CDN — a repeat request never reaches PHP at all. Combined with Varnish this yields instant page responses. GET-based GraphQL is also much easier to warm with an FPC warmer — in the same amount of time you can warm 5–10 times more pages, because GraphQL responses are significantly faster than regular ones.

### Other optimizations: CSS, fonts, and more

Everything is tuned so there is no layout shift and the CWV score is 100 or close to it.

---

## Philosophy: lightweight over universal

The theme deliberately doesn't try to cover every Magento scenario. There is no forest of conditions and templates "for every possible case" — which is exactly why it is fast and easy to understand.

Some functionality that not everyone needs (for example, bundle and grouped products) is not included in the package. This is a conscious decision: such things are easy to code for a specific project — with AI assistance following the patterns of the existing code, or by our team. The codebase is compact and consistent, so AI assistants work with it well.

The main rule for customizations is to keep the bundle size within the defined limits: the theme's speed is not a one-time achievement but a budget we maintain.

---

## How the theme handles Page Builder

Page Builder is the usual stumbling block for headless storefronts. Its content is stored in the Magento database as HTML with service markup, it needs a separate request (which hurts performance), and rendering that markup in a React application is a pain of its own: either insert it "as is" and live with extremely heavy markup that is hard to style, or parse it into something lighter and maintain compatibility with every Page Builder update. On top of that, the editor itself is heavy and sluggish to work with.

We took a different path: the theme ships with its own visual editor built specifically for this theme. It opens at a separate URL, closed to other users. We put a lot of effort into making it genuinely pleasant to work with.

### What you can do in it

- **Create new pages quickly.** A new landing or content page comes together in minutes: create the page, drop in blocks, save — and it's already live on the storefront inside the store's real header and footer. No developer, no template edits.
- **Global shared blocks.** A block needed on several pages (footer, promo bar, benefits block, menu) is built once and attached anywhere. Fix it in one place — it changes on all pages at once.
- **Local blocks for a single page.** Everything unique to a specific page lives right inside it and doesn't clutter the shared catalog.
- **Flexible elements in any position.** A page is laid out with grids and sections, and anything can be dragged into any position: an image, a heading, text, a button, an HTML snippet. No rigid "image left, text right" templates.
- **Ready-made widgets.** A slider, a product carousel, and similar large blocks are inserted in one move — and the preview immediately shows live store data: the carousel talks to the same GraphQL as the storefront.

### Why it's convenient to work with

- **Real-time preview.** The storefront and the editor render pages with the same code: what the content manager sees while editing is literally the same React components the customer will see.
- **Mobile and tablet modes on the same screen.** Tablet and mobile previews are available right while editing. You can define separate styles for different devices.
- **Drag-and-drop without heavy libraries.** Dragging blocks and cells runs on native browser mechanisms — the editor doesn't pull in extra dependencies.

### What it means for speed

- **Zero content requests.** Page content lives alongside the storefront and lands directly in the HTML during server-side rendering, and content pages are prerendered at build time and served as static files. The "give me the CMS content" request disappears entirely — along with its load on Magento.
- **Content can't ruin performance.** The editor accepts images only in WebP/AVIF, and the block set is limited to the theme's optimized components. A content manager physically cannot insert a heavy slider or a three-megabyte JPEG and tank your PageSpeed score.
- **Header, footer, and menu live in the editor too.** They are the same shared blocks, and they need zero requests to Magento.

### And for content management

- **Change history for free.** Every save is a git commit with a clear description of what changed. You can always see who changed what, and any version of a page can be restored.
- **Content travels with the code.** Pages are files in the repository: they go through the same deployment pipeline as the theme code and move easily between environments (dev → staging → production) without database dumps.
- **The editor is easy to extend.** A new block is a regular React component plus an entry in the block catalog. No need to learn Page Builder internals — a block is written in hours, including with AI assistance following the existing examples.

If a project already has content in Page Builder, it is migrated once: pages are rebuilt in the editor from the available blocks, and from then on the content lives by the new scheme. It's usually quite fast.

---

## How to speed up Magento further

The theme solves the frontend part of the problem. The Magento backend can be accelerated too:

### Varnish warming for GraphQL

Since requests go out as GET, they can be cached in Varnish. Regular cache warming (crawling key categories and products on a schedule) means the first real visitor already gets a response from the cache instead of waiting for PHP. After cache invalidation on reindexing, warming restores full speed within minutes. Warming GraphQL is much faster than warming regular Magento pages — by a factor of 5–10.

### PHP on Swoole

Classic PHP-FPM boots the application from scratch on every request. Swoole keeps Magento permanently loaded in memory: the startup cost disappears, and GraphQL response times drop several-fold.
