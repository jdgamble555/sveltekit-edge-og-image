# sv

## Toolchain

Use Node.js 24 LTS (minimum 22.17) and install dependencies with `npm ci`.
The project uses SvelteKit 3, Svelte 5, Vite 8, Tailwind CSS 4 and Vitest 5.
TypeScript stays on 6.x because the current `typescript-eslint` release does not
support TypeScript 7. Node types follow the Node 24 runtime.

SvelteKit configuration now lives in `vite.config.ts`. Library imports use the
`#lib/*` subpath mapping in `package.json`, with explicit file extensions, following
the [SvelteKit 3 migration guide](https://svelte.dev/docs/kit/migrating-to-sveltekit-3).

`@cf-wasm/plugins` 0.2.0 declares Vite 6/7 peer support. A targeted npm override
and the compatibility wrapper in `vite.config.ts` support Vite 8's Rolldown module
markers and SvelteKit 3's build lifecycle. The wrapper packages native WASM imports
for Cloudflare and retains inline loaders until Node route analysis completes.
Revisit this workaround when the plugin officially supports Vite 8.

Run `npm run check`, `npm run lint` and `npm test` to validate changes. Before
running browser tests for the first time, run `npx playwright install chromium`.
The end-to-end tests build the app and verify both the home page and PNG generation.

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build in the Workers runtime with `npm run preview`.

## Cloudflare Workers

Deployment targets Cloudflare Workers with Static Assets. `wrangler.jsonc` sets
the Worker entry point, `ASSETS` binding, compatibility date and Node compatibility.
The Cloudflare adapter uses this configuration to build for Workers.

```bash
npm run build
npm run preview
```

Deploy to your Cloudflare account with `npm run deploy` (authenticate with
`npx wrangler login` first). The Worker name is `sveltekit-edge-og-image`; change
`name` in `wrangler.jsonc` to use a different name.

The end-to-end tests run the built app through `wrangler dev`, including PNG
generation with native WASM modules.
