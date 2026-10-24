import { defineConfig } from '@playwright/test';

export default defineConfig({
	use: { baseURL: 'http://127.0.0.1:4173' },
	webServer: {
		command: 'npm run build && npm run preview -- --ip 127.0.0.1 --port 4173 --inspector-port 0',
		timeout: 120_000,
		port: 4173
	},
	testDir: 'e2e'
});
