import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			runtime: 'edge'
		}),
		csp: {
			//...other options,
			"directives": {
				"script-src": [
					"self'",
					"blob:",
					"'unsafe-eval'",
				],
				reportOnly: {
					'script-src': ['self'],
					'report-uri': ['/']
				}
			}
		},
		csrf: {
			checkOrigin: false
		}
	}
};

export default config;
