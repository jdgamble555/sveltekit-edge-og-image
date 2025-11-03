import tailwindcss from '@tailwindcss/vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type PluginOption } from 'vite';

//import wasm from 'vite-plugin-wasm';
//import topLevelAwait from 'vite-plugin-top-level-await';

function stripOgFallbackFont(): PluginOption {
  // 1) Exact/near-exact pattern for the fallback promise
  const FALLBACK_ASSIGN_RE =
    /(?:var|let|const)\s+fallbackFont\s*=\s*fetch\(\s*new\s+URL\(\s*["']\.\/noto-sans[^"']*?\.ttf["']\s*,\s*import\.meta\.url\s*\)\s*\)\s*\.then\(\s*(?:\(\s*res\s*\)|res)\s*=>\s*res\.arrayBuffer\(\)\s*\)\s*;?/g;

  // 2) Safety net: rewrite any remaining new URL("./...noto-sans...ttf", import.meta.url)
  const ANY_URL_TTF_RE =
    /new\s+URL\(\s*["']\.\/[^"']*?noto-sans[^"']*?\.ttf["']\s*,\s*import\.meta\.url\s*\)/g;

  return {
    name: 'strip-og-fallback-font',
    enforce: 'pre' as const,   // run before other transforms
    apply: 'build',            // remove if you also want this active in dev
    transform(code, id) {
      // only touch @vercel/og or satori
      if (!/node_modules\/(@vercel\/og|satori)\//.test(id)) return;

      let out = code;
      let changed = false;

      if (FALLBACK_ASSIGN_RE.test(out)) {
        out = out.replace(
          FALLBACK_ASSIGN_RE,
          // same variable, but resolved to empty data
          'var fallbackFont = Promise.resolve(new ArrayBuffer(0));'
        );
        changed = true;
      }

      if (ANY_URL_TTF_RE.test(out)) {
        out = out.replace(
          ANY_URL_TTF_RE,
          // ensure no filesystem read happens (safe, empty font)
          `new URL('data:font/ttf;base64,', import.meta.url)`
        );
        changed = true;
      }

      if (changed) return { code: out, map: null };
    }
  };
}


export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson(), stripOgFallbackFont()],
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
