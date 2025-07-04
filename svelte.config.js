import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			runtime: 'edge'
		}),
		csp: {
			directives: {
				"script-src": [
					"self'",
					"blob:",
					"'unsafe-eval'",
					"'unsafe-inline'"
				],
			},
			reportOnly: {
				'script-src': ['self'],
				'report-uri': ['/']
			}
		},
		csrf: {
			checkOrigin: false
		}
	}
};

export default config;
