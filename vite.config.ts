import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { defineConfig } from 'vite';
import { saveImages } from './scripts/save-post-images';
import dotenv from 'dotenv';
import devtoolsJson from "vite-plugin-devtools-json";

dotenv.config(); // load env vars from .env

export default defineConfig({
	plugins: [enhancedImages(), sveltekit(), devtoolsJson(), saveImages()]
});
