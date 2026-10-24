import { defineConfig } from '@playwright/test';

export default defineConfig({
	use: { baseURL: 'http://localhost:4173' },
	webServer: {
		command: 'npm run build && npm run preview -- --host localhost --port 4173 --strictPort',
		timeout: 120_000,
		port: 4173
	},
	testDir: 'e2e'
});
