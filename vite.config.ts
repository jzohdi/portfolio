import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { defineConfig } from 'vitest/config';
import { saveImages } from './scripts/save-post-images';
import dotenv from 'dotenv';
import devtoolsJson from "vite-plugin-devtools-json";

dotenv.config({ quiet: true }); // load env vars from .env (dotenv 17+ logs a line unless quiet)

export default defineConfig({
	plugins: [enhancedImages(), sveltekit(), devtoolsJson(), saveImages()],
	test: {
		// Unit tests live next to the code; tests/smoke/ is Playwright's (npm run test:smoke).
		include: ['src/**/*.{test,spec}.{js,ts}'],
		passWithNoTests: true
	}
});
