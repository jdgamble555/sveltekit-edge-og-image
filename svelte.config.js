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
					"'unsafe-eval'",
				]
			}
		},
		csrf: {
			checkOrigin: false
		}
	}
};

export default config;
