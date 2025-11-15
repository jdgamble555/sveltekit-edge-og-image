import tailwindcss from '@tailwindcss/vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import cloudflareModules from '@cf-wasm/plugins/vite-cloudflare-modules';
//import wasm from 'vite-plugin-wasm';
//import topLevelAwait from 'vite-plugin-top-level-await';
//import { cloudflare } from "@cloudflare/vite-plugin";
//import wasm from 'vite-plugin-wasm-esm';
//import wasmModuleWorkers from 'vite-plugin-wasm-module-workers';	

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		devtoolsJson(),
		cloudflareModules()
	]
});
