# Deployment notes

## Vercel: reducing OOM during “Deploying outputs”

If the build completes but the deployment fails with **Out of Memory** during “Deploying outputs” (large `node_modules` + output), try:

1. **Production-only install (smaller node_modules)**  
   In Vercel → Project → **Settings → General → Build & Development Settings**, set **Install Command** to:
   ```bash
   npm ci --omit=dev --legacy-peer-deps
   ```
   This skips devDependencies (eslint, husky, prettier, etc.) so only runtime and build-time deps are installed. The repo has `cross-env` in dependencies so the build script still works.

2. **Prebuilt deploy (offload build)**  
   Build locally (or in CI with more RAM), then deploy the prebuilt output so Vercel only uploads artifacts.

   **If your Vercel project’s Root Directory is set to `web`** (monorepo): run `npm ci` and `npm run build` from `web/`, but run `vercel build` and `vercel deploy --prebuilt` from the **repository root** (parent of `web`). Otherwise the CLI looks for `web/web/package.json` and fails.
   ```bash
   cd web
   npm ci
   npm run build
   cd ..
   npx vercel build
   npx vercel deploy --prebuilt
   ```

   **If the project has no Root Directory** (app is at repo root): run everything from the repo root:
   ```bash
   npm ci
   npm run build
   npx vercel build
   npx vercel deploy --prebuilt
   ```
   (`npx vercel` uses the Vercel CLI without a global install.)

   **Windows: "EPERM: operation not permitted, symlink"**  
   The prebuilt flow creates symlinks; Windows often blocks this. Use one of:
   - **Developer Mode:** Settings → Privacy & security → For developers → turn **Developer Mode** on (allows symlinks without admin).
   - **Run terminal as Administrator:** Right‑click PowerShell/terminal → “Run as administrator”, then run `npx vercel build` and `npx vercel deploy --prebuilt` from the repo root.
   - **WSL:** Run the same commands from WSL (e.g. Ubuntu); symlinks work there.
   - **Skip prebuilt:** Push to Git and let Vercel build on their Linux servers (no symlink issue). With the repo’s OOM fixes, a normal deploy may succeed.

   **Windows: "ENOENT ... /vercel/path0/.vercel/output/functions/..." after deploy --prebuilt**  
   The upload can succeed but Vercel’s servers then fail to find some artifacts (e.g. `_global-error.segments`). This is a known quirk with prebuilt deploys from Windows. Prefer one of:
   - **Normal deploy:** Push to Git and deploy from the Vercel dashboard (no local prebuilt). With the repo’s OOM fixes, this often works.
   - **Prebuilt from WSL:** Run `vercel build` and `vercel deploy --prebuilt` from WSL (Ubuntu) so the artifact layout matches what Vercel expects.

3. **Enhanced Builds**  
   If available on your plan, enable a larger build machine (e.g. 16 GB) in project settings to avoid OOM.

## Environment variables

Set these in your production environment:

- **`NEXT_PUBLIC_SITE_URL`** – Full public URL of the site (e.g. `https://kaleidoscopedentalacademy.com`). Used for sitemap, robots, canonical URLs, and Open Graph.
- **`BLOB_READ_WRITE_TOKEN`** – Required for uploads in production (course card images, case images, video testimonials and posters). Add it in Vercel → Project → Settings → Environment Variables (from the Vercel Blob storage in the dashboard). Without it, uploads would fail on Vercel. Local dev uses `public/` fallback; those paths are gitignored so large media is not committed.

Optional (for search engine verification):

- **`GOOGLE_SITE_VERIFICATION`** – Content value from the Google Search Console HTML meta tag (the part that goes in `content="..."`).
- **`BING_SITE_VERIFICATION`** – Content value from the Bing Webmaster Tools meta tag (the part that goes in `content="..."`).

## Support URL

Support is provided through the contact page. The canonical support URL is:

**Support URL:** `{NEXT_PUBLIC_SITE_URL}/contact`

All in-app “Contact” and “Contact support” links point to `/contact`. Ensure `NEXT_PUBLIC_SITE_URL` is set in production so any absolute links (e.g. in emails) use the correct domain.

## Google Search Console and Bing Webmaster Tools

1. **Google Search Console:** Add your property → choose “HTML tag” verification → copy the `content` value from the meta tag → set it as `GOOGLE_SITE_VERIFICATION` in your env and redeploy.
2. **Bing Webmaster Tools:** Add your site → choose “Meta tag” verification → copy the `content` value → set it as `BING_SITE_VERIFICATION` in your env and redeploy.
3. **Sitemap:** After verification, submit your sitemap in both tools: `{NEXT_PUBLIC_SITE_URL}/sitemap.xml`
