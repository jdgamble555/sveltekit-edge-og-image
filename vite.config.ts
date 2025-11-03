import tailwindcss from '@tailwindcss/vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type PluginOption } from 'vite';

//import wasm from 'vite-plugin-wasm';
//import topLevelAwait from 'vite-plugin-top-level-await';

function patchVercelOgFallback(): PluginOption {
  // ---- Edge build: replace var fallbackFont = fetch(new URL('./...ttf', import.meta.url)).then(...)
  const EDGE_DECL_RE =
    /(var|let|const)\s+fallbackFont\s*=\s*fetch\(\s*new\s+URL\(\s*["']\.\/noto-sans[^"']*?\.ttf["']\s*,\s*import\.meta\.url\s*\)\s*\)\s*\.then\(\s*(?:\(\s*res\s*\)|res)\s*=>\s*res\.arrayBuffer\(\)\s*\)\s*;?/;

  const EDGE_DECL_REPLACEMENT =
    `async function getFallbackFont(){` +
    `const res=await fetch('https://cdn.jsdelivr.net/npm/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff');` +
    `return res.arrayBuffer();}`; // your requested patch

  // `Promise.all([fallbackFont, initializedResvg])` and reversed
  const EDGE_ALL_A = /Promise\.all\(\s*\[\s*fallbackFont\s*,\s*initializedResvg\s*\]\s*\)/g;
  const EDGE_ALL_B = /Promise\.all\(\s*\[\s*initializedResvg\s*,\s*fallbackFont\s*\]\s*\)/g;

  // ---- Node build: replace
  // var fontData = fs2.readFileSync(fileURLToPath(new URL("./noto-sans-...ttf", import.meta.url)));
  const NODE_FONT_RE =
    /(var|let|const)\s+fontData\s*=\s*fs\d*\.readFileSync\(\s*fileURLToPath\(\s*new\s+URL\(\s*["']\.\/noto-sans[^"']*?\.ttf["']\s*,\s*import\.meta\.url\s*\)\s*\)\s*\)\s*;?/;

  // We safely stub with an empty Buffer so no file URL resolution occurs
  const NODE_FONT_REPLACEMENT = `var fontData = Buffer.alloc(0);`;

  return {
    name: 'patch-vercel-og-fallback-font-both',
    enforce: 'pre', // run before bundling/transforms
    apply: 'build',
    transform(code, id) {
      let changed = false;
      let out = code;

      // Edge build file
      if (/node_modules\/@vercel\/og\/dist\/index\.edge\.(js|mjs)$/.test(id)) {
        if (EDGE_DECL_RE.test(out)) {
          out = out.replace(EDGE_DECL_RE, EDGE_DECL_REPLACEMENT);
          changed = true;
        }
        if (EDGE_ALL_A.test(out)) {
          out = out.replace(EDGE_ALL_A, 'Promise.all([getFallbackFont(), initializedResvg])');
          changed = true;
        }
        if (EDGE_ALL_B.test(out)) {
          out = out.replace(EDGE_ALL_B, 'Promise.all([initializedResvg, getFallbackFont()])');
          changed = true;
        }
      }

      // Node build file
      if (/node_modules\/@vercel\/og\/dist\/index\.node\.(js|mjs)$/.test(id)) {
        if (NODE_FONT_RE.test(out)) {
          out = out.replace(NODE_FONT_RE, NODE_FONT_REPLACEMENT);
          changed = true;
        }
      }

      if (changed) return { code: out, map: null };
    }
  };
}

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson(), patchVercelOgFallback()],
	ssr: {
		noExternal: ['@vercel/og']
	},
	optimizeDeps: {
		exclude: ['@vercel/og']
	},
	test: {
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					environment: 'browser',
					browser: {
						enabled: true,
						provider: 'playwright',
						instances: [{ browser: 'chromium' }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	},

});
