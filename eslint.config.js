import prettier from 'eslint-config-prettier';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

export default defineConfig(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		},

		rules: {
			// typescript-eslint recommends turning no-undef off in TypeScript projects: TypeScript
			// checks it, and the rule doesn't know type-only globals such as GPUTextureFormat.
			'no-undef': 'off',
			// New in eslint-plugin-svelte 3's recommended set. They flag code that predates the
			// upgrade, so they warn instead of failing lint until that code is cleaned up.
			'svelte/require-each-key': 'warn',
			'svelte/no-navigation-without-resolve': 'warn',
			'svelte/no-useless-mustaches': 'warn',
			'svelte/prefer-svelte-reactivity': 'warn',
			'svelte/no-dom-manipulating': 'warn',
			'svelte/prefer-writable-derived': 'warn',
			// Already failing on main before the upgrade (98dd040: 91 errors, 72 of them unused
			// variables). Warnings until the code is cleaned up, so lint can gate new errors.
			'@typescript-eslint/no-unused-vars': 'warn',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-expressions': 'warn',
			'no-irregular-whitespace': 'warn'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],

		languageOptions: {
			parserOptions: {
				parser: ts.parser,
				extraFileExtensions: ['.svelte'],
				svelteConfig
			}
		}
	},
	{
		// static/sudoku/sudoku.js is Emscripten's generated loader for the sudoku WASM.
		ignores: ['build/', '.svelte-kit/', 'dist/', 'static/sudoku/sudoku.js']
	}
);
