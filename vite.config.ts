import tailwindcss from '@tailwindcss/vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type PluginOption } from 'vite';

//import wasm from 'vite-plugin-wasm';
//import topLevelAwait from 'vite-plugin-top-level-await';

function removeOgFallbackFont(): PluginOption {
  const FALLBACK_DECL_RE =
    /var\s+fallbackFont\s*=\s*fetch\(\s*new\s+URL\(\s*["']\.\/noto-sans-v27-latin-regular\.ttf["']\s*,\s*import\.meta\.url\s*\)\s*\)\s*\.then\(\s*\(\s*res\s*\)\s*=>\s*res\.arrayBuffer\(\)\s*\)\s*;?/g;

  return {
    name: 'remove-og-fallback-font',
    // `PluginOption` accepts objects with extra keys (so this is safe)
    enforce: 'pre' as const,
    transform(code, id) {
      if (!/node_modules\/(@vercel\/og|satori)\//.test(id)) return;

      if (FALLBACK_DECL_RE.test(code)) {
        const replaced = code.replace(
          FALLBACK_DECL_RE,
          'var fallbackFont = Promise.resolve(new ArrayBuffer(0));'
        );
        return { code: replaced, map: null };
      }
    }
  };
}


export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson(), removeOgFallbackFont()],
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
