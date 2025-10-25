import tailwindcss from '@tailwindcss/vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

function ogFontRewritePlugin(): Plugin {
  return {
    name: 'rewrite-vercel-og-fallback-font',
    enforce: 'pre',
    transform(code, id) {
      // Match the built edge file from @vercel/og that SvelteKit will import
      if (id.includes('/node_modules/@vercel/og/dist/index.edge.js')) {
        // Replace the local file fetch with a remote URL fetch
        const replaced = code.replace(
          /var fallbackFont = fetch\(new URL\(".*?noto-sans-v27-latin-regular\.ttf", import\.meta\.url\)\)\.then\(\(res\) => res\.arrayBuffer\(\)\);/,
          'var fallbackFont = fetch("https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-500-normal.woff").then((res) => res.arrayBuffer());'
          // You can swap that URL to your own static font URL if you don't want to rely on jsdelivr.
        );

        return {
          code: replaced,
          map: null
        };
      }

      return null;
    }
  };
}


export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson(), ogFontRewritePlugin()],
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
