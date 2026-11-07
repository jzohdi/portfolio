# Portfolio

## Development

- **Node 24** (`.nvmrc`; `engines` and `engine-strict` refuse anything else), then `npm ci`.
- **Notion:** every page is prerendered from Notion, so `dev` and `build` need `NOTION_API_KEY`
  and `NOTION_DATABASE_ID` (in the environment or a `.env`). `build` also downloads the post,
  project and experiment images into `static/`, which can rewrite tracked files there.
- `npm run check` only generates types from those variables, so any values will do:
  `NOTION_API_KEY=x NOTION_DATABASE_ID=x npm run check`.
- `npm run lint` (Prettier, then ESLint) and `npm test` (Vitest, `src/**/*.test.ts`) need neither.
- **Smoke test** of the site's behavior against a running build or a deployment (read-only):
  `BASE_URL=https://jakezohdi.dev npm run test:smoke`. See `playwright.config.ts`.
- **Security headers** are set in `vercel.json` (the pages are static files, so hooks never run).

### Dependency notes

- `overrides` pin patched transitive versions: glob 14.0.3 under `@vercel/nft` (GHSA-3g3m),
  minimatch 11.0.4 for 10.x (GHSA-g3hv; glob 14 is the glob built for minimatch 11) and
  cookie 0.7.2 under Kit (GHSA-pxg6). Drop each once its parent depends on a fixed version.
- `allowScripts` denies esbuild's and fsevents' install scripts; both work without them.
- `svelte-gestures` stays on 5.1.x: 5.2 renamed `pan`/`pinch` (used by `ResumeThree.svelte`).
- `bits-ui` 0.22 (shadcn-svelte) declares Svelte 4 as a peer, hence npm's peer warning. It goes
  away with the move to Tailwind 4 and bits-ui 2.

## TODO

- update 2048 to be pictures of tim robinson instead of numbers
- 2048 ai in worker?
- create library for adding nav scroller to web page.
- meta data / SEO
- improve react draw docs
- create package to webgl render water effects (based on mindful draw water)
- everything ever - scroll for every word, scroll down to go A.B, scroll left to see further A..Z
- offline mode (offline from notion)

## Post ideas

- [ ] Implementing JWT
- [ ] What I learned about digital payments
- [ ] Imagine you are in the middle of a migration - clean code concept. imagine being in the middle of a database migration.
      how would you write the code here.
- [ ] how to use react draw to create AI svgs

## Other Ideas

- interactive body simulator game (webgl/threejs?)
- sqlite cache for notion queries - json files
