import tailwindcss from '@tailwindcss/vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';
//import wasm from 'vite-plugin-wasm';
//import topLevelAwait from 'vite-plugin-top-level-await';


export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
	ssr: {
		noExternal: ['@vercel/og']
	},
	optimizeDeps: {
		exclude: ['@vercel/og']
	},
	assetsInclude: ['**/*.ttf', '**/*.otf', '**/*.woff', '**/*.woff2'],
	resolve: {
		alias: {
			// IMPORTANT: alias the literal the package uses
			'./noto-sans-v27-latin-regular.ttf':
				path.resolve('src/lib/assets/fonts/noto-sans-v27-latin-regular.ttf'),
			// (sometimes the code references it without './' too — harmless to add)
			'noto-sans-v27-latin-regular.ttf':
				path.resolve('src/lib/assets/fonts/noto-sans-v27-latin-regular.ttf')
		}
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
