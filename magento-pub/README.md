# `magento-pub/`

Server-side PHP helpers that live in **Magento's `pub/` directory** and are
called directly by the React storefront. They bypass Magento's bootstrap
(autoloader, DI, app initialisation) and talk to the database via raw PDO
— so each request finishes in single-digit milliseconds instead of the
~150 ms a typical GraphQL roundtrip costs.

Source of truth lives **in this repository**. The actual deployment is a
copy in Magento's filesystem.

## Files

| File | URL | Purpose |
|---|---|---|
| `getReactResolveUrl.php` | `/getReactResolveUrl.php?prefix=<path>` | Looks up `url_rewrite` entries by request_path prefix for a given store. Used by the storefront to resolve `/some-product.html` → `{ type: PRODUCT, id: 4 }` without touching Magento's GraphQL `route()` resolver. |

## Deployment

For each Magento environment (dev container, staging, prod), copy the
files in this folder into Magento's `pub/`:

```
cp magento-pub/*.php  $MAGENTO_ROOT/pub/
```

The storefront calls them on the Magento origin via the proxy in
`server/index.js` (path `/getReactResolveUrl.php` is whitelisted there).

For the local LXC container at `~/lxc/m248/source/`:

```
cp magento-pub/getReactResolveUrl.php ~/lxc/m248/source/pub/
```

Anyone editing files here must remember to re-sync. There is no
automated sync — these are tiny scripts that change rarely.

## Why direct DB access, not a Magento module

Writing this as a custom Magento module (e.g. `Freento_ReactBridge`) would
require:

- Module XML registration, `composer.json`, DI wiring
- Going through the full Magento request bootstrap on each call (~150 ms
  overhead even with FPM warm)
- Cache-flush + setup:upgrade after deploy

For a read-only lookup against an indexed table, that's all dead weight.
A plain PHP file in `pub/` with `require app/etc/env.php` for credentials
is two orders of magnitude faster and has no Magento dependencies to
maintain across upgrades.

## Conventions for new endpoints

If you add another helper here, follow the same shape:

- `declare(strict_types=1);`
- Sets `Content-Type: application/json` + a sane `Cache-Control`
- Validates all inputs via allow-list regex before touching the DB
- Uses prepared statements with named parameters; **never** string-concat
  user input into SQL
- Catches `Throwable` at the top level, logs via `error_log`, returns a
  generic 500 to the client (don't leak schema/credential fragments)
- Persistent PDO (`ATTR_PERSISTENT => true`) so the TCP/handshake cost
  doesn't repeat per request under PHP-FPM
- Reads multi-store context from an HTTP `Store: <code>` header (matches
  Magento's GraphQL convention); falls back to the first active frontend
  store when absent
