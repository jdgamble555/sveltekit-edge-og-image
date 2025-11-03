import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	preprocess: vitePreprocess(),
	kit: {
		vite: {
			ssr: {
				noExternal: ['@vercel/og']
			}
		},
		adapter: adapter(),
		csp: {
			mode: 'auto',
			directives: {
				'script-src': ['self', 'blob:', 'unsafe-eval', 'wasm-unsafe-eval']
			}
		}
	}
};

export default config;
