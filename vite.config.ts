import tailwindcss from '@tailwindcss/vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type PluginOption } from 'vite';

//import wasm from 'vite-plugin-wasm';
//import topLevelAwait from 'vite-plugin-top-level-await';

function patchOgFallbackInOutput(): PluginOption {
  // Matches: var fallbackFont = fetch(new URL("./noto-sans...ttf", import.meta.url)).then(res => res.arrayBuffer());
  const FALLBACK_ASSIGN_RE =
    /(var|let|const)\s+fallbackFont\s*=\s*fetch\(\s*new\s+URL\(\s*["']\.\/noto-sans[^"']*?\.ttf["']\s*,\s*import\.meta\.url\s*\)\s*\)\s*\.then\(\s*(?:\(\s*res\s*\)|res)\s*=>\s*res\.arrayBuffer\(\)\s*\)\s*;?/;

  return {
    name: 'patch-og-fallback-in-output',
    // run after bundling so we can patch the final chunk
    enforce: 'post',
    apply: 'build',
    generateBundle(_options, bundle) {
      for (const [fileName, out] of Object.entries(bundle)) {
        // look for the server chunk of your /og endpoint
        if (
          fileName.includes('entries/endpoints/og/_server') &&
          out.type === 'chunk'
        ) {
          let code = out.code;
          if (FALLBACK_ASSIGN_RE.test(code)) {
            code = code.replace(
              FALLBACK_ASSIGN_RE,
              'var fallbackFont = Promise.resolve(new ArrayBuffer(0));'
            );
            out.code = code;
            this.warn(`Patched fallback font in ${fileName}`);
          }
          // OPTIONAL safety: nuke any lingering new URL("./...noto-sans...ttf", import.meta.url)
          const ANY_URL_TTF_RE =
            /new\s+URL\(\s*["']\.\/[^"']*?noto-sans[^"']*?\.ttf["']\s*,\s*import\.meta\.url\s*\)/g;
          if (ANY_URL_TTF_RE.test(out.code)) {
            out.code = out.code.replace(
              ANY_URL_TTF_RE,
              // Use a harmless data URL so no file URL conversion is attempted
              `new URL('data:font/ttf;base64,', import.meta.url)`
            );
            this.warn(`Rewrote ttf URL to data: in ${fileName}`);
          }
        }
      }
    }
  };
}


export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson(), patchOgFallbackInOutput()],
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
