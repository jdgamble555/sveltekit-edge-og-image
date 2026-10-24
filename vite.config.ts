import tailwindcss from '@tailwindcss/vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import additionalModules from '@cf-wasm/plugins/vite-additional-modules';
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { playwright } from '@vitest/browser-playwright';

// Rolldown escapes virtual module IDs as \u0000; the plugin expects \0.
function wasmModules() {
	const plugin = additionalModules();
	const renderChunk = plugin.renderChunk;
	if (typeof renderChunk === 'function') {
		plugin.renderChunk = function (code, chunk, ...args) {
			const references = Array.from(
				code.matchAll(
					/\\u0000(____CF_WASM:ADDITIONAL_MODULE__:.*?:__CF_WASM:ADDITIONAL_MODULE____)/g
				),
				(match) => '\0' + match[1]
			);
			return renderChunk.call(
				this,
				code.replaceAll('\\u0000____CF_WASM', '\0____CF_WASM'),
				{ ...chunk, imports: [...chunk.imports, ...references] },
				...args
			);
		};
	}
	return plugin;
}

const modules = wasmModules();
modules.applyToEnvironment = (environment) => environment.name === 'ssr';
const finalizeModules = modules.writeBundle;
delete modules.writeBundle;
const cloudflareAdapter = adapter();

export default defineConfig({
	ssr: {
		noExternal: [/@cf-wasm\/.*/, 'satori']
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			adapter: {
				...cloudflareAdapter,
				async adapt(builder) {
					// Keep inline loaders for Kit's Node route analysis; switch to
					// native WASM imports immediately before packaging for Cloudflare.
					if (typeof finalizeModules === 'function')
						await Reflect.apply(finalizeModules, undefined, []);
					await cloudflareAdapter.adapt(builder);
				}
			},
			preprocess: vitePreprocess()
		}),
		devtoolsJson(),
		modules
	],
	test: {
		projects: [
			{
				extends: true,
				test: {
					name: 'client',
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					browser: {
						enabled: true,
						headless: true,
						provider: playwright(),
						instances: [{ browser: 'chromium' }]
					}
				}
			},
			{
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
