# Deploying DevPad

DevPad is a fully static site (`npm run build` → `dist/`), so any static host works
for ≈ €0. Two documented paths below. _Status: not yet deployed — do this when ready._

## Option A — Cloudflare Pages (recommended; already in use elsewhere)

1. **dash.cloudflare.com** → **Workers & Pages** → **Create** → **Pages** tab →
   **Connect to Git**.
2. Authorize GitHub and pick **`TtheProg/DevPad`**.
3. Build settings:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - (Node version: 20+ — set `NODE_VERSION = 20` as an env var if the build picks an old default.)
4. **Save and Deploy** → you get a `https://devpad-xxx.pages.dev` URL. Every push to
   `main` redeploys automatically.

## Option B — Vercel

1. **vercel.com/new** → import **`TtheProg/DevPad`**.
2. Vercel auto-detects Astro; defaults (`npm run build`, output `dist`) are correct.
3. **Deploy** → `https://devpad-xxx.vercel.app`.

Or CLI: `npx vercel` (preview) / `npx vercel --prod`.

## After deploying

- Put the live URL at the top of [`README.md`](../README.md) and in `IDEA.md`'s
  "Showcase plan".
- Sanity check: open the site, then **DevTools → Network**, drop in a file — confirm
  **no upload request** appears (the privacy claim).
- Confirm the service worker registers (DevTools → Application → Service Workers) so the
  app works offline after first load.

---

## macOS app distribution (later — needs Apple Developer account)

The unsigned local build (`npm run tauri build`) is fine for personal use. To hand the
`.dmg` to other people without Gatekeeper warnings you need:

1. **Apple Developer Program** membership (~$99/yr).
2. A **Developer ID Application** signing certificate.
3. Configure signing + notarization in `src-tauri/tauri.conf.json` (`bundle.macOS`) and
   set the notarization credentials as env vars, then `npm run tauri build`.

See the Tauri v2 macOS code-signing guide when the account is ready. Until then, link the
notarized build as a future release on the repo.
