import { defineConfig, devices } from '@playwright/test';

// Journeys run on the dev server (test wallet and TEST ONLY areas are development-only)
// against a freshly seeded throwaway local state, never the everyday local data.
export default defineConfig({
	webServer: {
		command:
			'npm run db:e2e:setup && DATHRIFT_STATE_DIR=.wrangler/e2e npx vite dev --port 4173 --strictPort',
		port: 4173,
		reuseExistingServer: false,
		timeout: 180_000
	},
	use: { baseURL: 'http://localhost:4173' },
	workers: 1,
	testMatch: '**/*.e2e.{ts,js}',
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } },
		{ name: 'mobile', use: { ...devices['Pixel 7'] } }
	]
});
