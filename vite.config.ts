import tailwindcss from '@tailwindcss/vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';


export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
	build: {
		rollupOptions: {
			// tell Vite how to load .wasm like Next.js does
			plugins: [
				{
					name: 'vercel-og-wasm-module-loader',
					async load(id) {
						if (id.endsWith('resvg.wasm') || id.endsWith('yoga.wasm')) {
							// Convert the binary into a base64-encoded JS module that exports
							// a WebAssembly.Module, so Edge treats it as a static module.
							const fs = await import('node:fs');
							const data = fs.readFileSync(id);
							const base64 = data.toString('base64');
							return `
                const bytes = Uint8Array.from(atob("${base64}"), c => c.charCodeAt(0));
                export default await WebAssembly.compile(bytes);
              `;
						}
					}
				}
			]
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
