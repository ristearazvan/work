# Amalia page block (temporary)

**Status:** Amalia's public page is BLOCKED since 2026-11-06 (deploy version `2ef68adc`).

All `/book/amalia/...` pages and `/api/amalia/...` public endpoints return
`500 Server error`. Her provider app, login and data are untouched. Nothing was deleted.

The block is not committed to git. It is a local change in `src/worker.js` that is deployed.

## How to lift it (about 1 minute)

1. In `src/worker.js`, find this line (near the `// Router` section):

   ```js
   const DISABLED_SLUGS = new Set(['amalia']);
   ```

   Change it to:

   ```js
   const DISABLED_SLUGS = new Set([]);
   ```

2. Deploy:

   ```bash
   cd ~/work && npx wrangler deploy
   ```

   If it says "Failed to fetch auth token", run `npx wrangler login` first, then deploy again.

3. Check it in a browser (refresh, or use a private window):
   https://work.agenda-app.workers.dev/book/amalia

   It should show her booking page again, not "Server error".

Or just tell Claude: "lift the Amalia block, see AMALIA_BLOCK.md".

## Removing the block code entirely (optional)

```bash
cd ~/work && git checkout src/worker.js && npx wrangler deploy
```

This restores `worker.js` to the last commit, which has no block code. Only do this
if `worker.js` has no other uncommitted changes you want to keep.

## Blocking someone else the same way

Put their slug in the list, e.g. `new Set(['amalia', 'other-slug'])`, then deploy.
