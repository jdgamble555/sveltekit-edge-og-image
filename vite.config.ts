import tailwindcss from '@tailwindcss/vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type PluginOption } from 'vite';

//import wasm from 'vite-plugin-wasm';
//import topLevelAwait from 'vite-plugin-top-level-await';

function patchVercelOgFallback(): PluginOption {
  // 1) Replace the fallbackFont declaration with your getFallbackFont()
  const DECL_RE =
    /(var|let|const)\s+fallbackFont\s*=\s*fetch\(\s*new\s+URL\(\s*["']\.\/noto-sans[^"']*?\.ttf["']\s*,\s*import\.meta\.url\s*\)\s*\)\s*\.then\(\s*(?:\(\s*res\s*\)|res)\s*=>\s*res\.arrayBuffer\(\)\s*\)\s*;?/;

  const DECL_REPLACEMENT =
    `async function getFallbackFont(){` +
    `const res=await fetch('https://cdn.jsdelivr.net/npm/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff');` +
    `return res.arrayBuffer();}`; // <- your exact logic

  // 2a) Replace Promise.all([fallbackFont, initializedResvg])
  const ALL_RE_A =
    /Promise\.all\(\s*\[\s*fallbackFont\s*,\s*initializedResvg\s*\]\s*\)/g;

  // 2b) Replace Promise.all([initializedResvg, fallbackFont])
  const ALL_RE_B =
    /Promise\.all\(\s*\[\s*initializedResvg\s*,\s*fallbackFont\s*\]\s*\)/g;

  return {
    name: 'patch-vercel-og-fallback-font',
    enforce: 'pre',   // run early, before bundling
    apply: 'build',
    transform(code, id) {
      // Only touch the edge build of @vercel/og
      if (!/node_modules\/@vercel\/og\/dist\/index\.edge\.(js|mjs)$/.test(id)) return;

      let changed = false;
      let out = code;

      if (DECL_RE.test(out)) {
        out = out.replace(DECL_RE, DECL_REPLACEMENT);
        changed = true;
      }

      if (ALL_RE_A.test(out)) {
        out = out.replace(ALL_RE_A, 'Promise.all([getFallbackFont(), initializedResvg])');
        changed = true;
      }

      if (ALL_RE_B.test(out)) {
        out = out.replace(ALL_RE_B, 'Promise.all([initializedResvg, getFallbackFont()])');
        changed = true;
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
