import { defineConfig } from '@playwright/test';

/**
 * Behavior smoke test (tests/smoke/) against a running site. It never starts a server:
 *
 *   npm run build && npm run preview -- --port 4173   (a local build needs the Notion env)
 *   BASE_URL=http://localhost:4173 npm run test:smoke
 *
 * BASE_URL may point at a deployment (https://jakezohdi.dev, or a protected preview with
 * VERCEL_OIDC_TOKEN set). The tests only read: see tests/smoke/fixtures.ts.
 */
export default defineConfig({
	testDir: 'tests/smoke',
	testMatch: '*.spec.ts',
	reporter: 'list',
	timeout: 90_000,
	use: {
		baseURL: (process.env.BASE_URL ?? 'http://localhost:4173').replace(/\/$/, ''),
		// The installed Google Chrome, so no Playwright browser download is needed.
		channel: 'chrome',
		launchOptions: { args: ['--mute-audio', '--enable-unsafe-swiftshader'] },
		reducedMotion: 'reduce',
		serviceWorkers: 'block',
		colorScheme: 'light',
		timezoneId: 'UTC',
		locale: 'en-US',
		viewport: { width: 1280, height: 800 }
	}
});
