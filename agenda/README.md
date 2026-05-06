# Agenda Web App

This folder contains the browser-facing Agenda app served by the Cloudflare
Worker asset binding.

## Runtime Shape

There is no bundler in this app. `index.html` loads React, ReactDOM, Babel, and
then each local script in dependency order. That order is the module graph:

1. `js/data.js` defines Romanian strings, defaults, localStorage helpers, and
   exposes `window.AG_T` plus `window.AG_STORE`.
2. `js/sync.js` defines the authenticated Worker API client and exposes
   `window.AG_SYNC`.
3. `js/mov-remux.js` exposes optional MOV remux helpers as `window.AG_MOV`.
4. `js/primitives.jsx` defines design tokens, date helpers, icons, and shared
   UI primitives, then exports them onto `window`.
5. `js/screens-*.jsx` and `js/screen-*.jsx` define screen components and export
   them onto `window`.
6. `js/app.jsx` owns app state, routing, sync orchestration, and mounts React.

Because these files communicate through browser globals, changing a filename,
load order, exported helper, or `window.AG_*` shape can break later scripts.

## File Map

- `index.html` is the provider/admin app shell.
- `book.html` is the public booking request page.
- `book-status.html` is the public status page for a submitted request.
- `book-album.html` is the public photo/video album page.
- `sw.js` caches the offline provider shell. When adding/removing provider app
  assets, update its `ASSETS` list and bump `CACHE`.
- `manifest.webmanifest` and `icons/` define the PWA install metadata.

Inside `js/`:

- `data.js` owns translations, default settings, service price normalization,
  session storage, and per-account local state storage.
- `sync.js` translates local settings and appointments to Worker API payloads.
- `primitives.jsx` owns theme tokens, common icons, date/money helpers, and
  small reusable UI blocks.
- `app.jsx` owns the top-level state shape, tab routing, login/logout,
  debounced config/busy sync, inbox refresh, and cross-screen actions.
- `screens-main.jsx` contains Home, Calendar, and Appointment Detail.
- `screens-secondary.jsx` contains New Appointment, Add Income, Analytics, and
  Flagged Directory.
- `screens-settings.jsx` contains Settings, Inbox, service-price editing,
  background editing, and external-link editing.
- `screen-login.jsx` contains Login.
- `screen-album.jsx` contains the authenticated album manager.
- `mov-remux.js` handles supported MOV-to-MP4 remuxing before upload.

## State And Sync

The main React state shape is:

```js
{
  settings,
  appointments,
  income,
  flagged,
  inbox
}
```

The active session is stored separately under `agenda-session-v1`. Per-account
state is stored under `agenda-state-v1:<slug>`, so multiple accounts on one
device do not share appointments or settings.

The Worker is authoritative for synced public-booking configuration. Keep these
pieces in step when adding a setting:

- `DEFAULT_SETTINGS` and `normalizeServicePrices` in `js/data.js`
- `configPayload` in `js/sync.js`
- `applyServerConfig` in `js/app.jsx`
- the Worker `/api/config` handlers and D1 migrations
- any public-page rendering that consumes `/api/<slug>/availability`

Appointments remain local-first. The app pushes them to the Worker as busy time
blocks so public booking pages can avoid unavailable slots.

## Editing Notes

- Keep the provider app shell and public booking pages separate. The public
  pages do not load the React app and intentionally duplicate a small amount of
  CSS/formatting so they stay simple.
- Prefer adding shared UI helpers to `primitives.jsx` when a style or layout is
  repeated across screens.
- Avoid large file moves unless you also update `index.html`, `sw.js`, and any
  URL/script references.
- The app currently has no `package.json`, local build step, lint command, or
  automated tests. Manual browser testing through Wrangler is the main safety
  check.

## Good Refactor Order

If this app grows, the safest readability improvements are:

1. Extract repeated screen chrome into shared primitives: screen shell, header,
   icon button, action row, settings section, and form hints.
2. Split the largest screen bundles by domain, especially Settings/Inbox and
   Secondary screens.
3. Move public-page CSS/JS into separate files if those pages keep expanding.
4. Consider ES modules or a small Vite build only after the current static
   deployment shape is stable.
