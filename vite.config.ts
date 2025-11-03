import tailwindcss from '@tailwindcss/vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
//import wasm from 'vite-plugin-wasm';
//import topLevelAwait from 'vite-plugin-top-level-await';
//import wasmModuleWorkers from 'vite-plugin-wasm-module-workers';	
//import wasmModuleVercel from './src/lib/wasm-module-vercel';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		devtoolsJson()
	],
	optimizeDeps: {
		include: ['@vercel/og'],
		force: true
	},
	ssr: {
		noExternal: ['@vercel/og']
	}
});
