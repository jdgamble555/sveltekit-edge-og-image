import tailwindcss from '@tailwindcss/vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';


export default defineConfig({
	ssr: {
		noExternal: [/@cf-wasm\/.*/]
	},
	plugins: [
		tailwindcss(),
		sveltekit(),
		devtoolsJson()
	]
});
