import tailwindcss from '@tailwindcss/vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
//import wasm from 'vite-plugin-wasm';
//import topLevelAwait from 'vite-plugin-top-level-await';
//import wasmModuleWorkers from 'vite-plugin-wasm-module-workers';	
import wasmModuleVercel from './src/lib/wasm-module-vercel';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson(), wasmModuleVercel()],
	ssr: {
		// ⬅️ crucial: bundle the package so the plugin can transform its .wasm import
		noExternal: ['@resvg/resvg-wasm']
	},
	optimizeDeps: {
		// optional: keep it out of pre-bundling; not required but avoids surprises
		exclude: ['@resvg/resvg-wasm']
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
	}
});
