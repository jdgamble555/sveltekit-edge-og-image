import tailwindcss from '@tailwindcss/vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import wasmModuleWorkers from 'vite-plugin-wasm-module-workers'
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson(), topLevelAwait(), wasm(), wasmModuleWorkers()],
	assetsInclude: ['**/*.wasm'],
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
	ssr: {
		// Ensure the wasm import stays bundled so ?module works in the server build
		noExternal: ['@resvg/resvg-wasm']
	},
	optimizeDeps: {
		// Avoid pre-bundling that could turn the wasm import back into a URL
		exclude: ['@resvg/resvg-wasm']
	}
});
