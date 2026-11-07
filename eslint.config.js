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
			// New in eslint-plugin-svelte 3's recommended set. They flag code that predates the
			// upgrade, so they warn instead of failing lint until that code is cleaned up.
			'svelte/require-each-key': 'warn',
			'svelte/no-navigation-without-resolve': 'warn',
			'svelte/no-useless-mustaches': 'warn',
			'svelte/prefer-svelte-reactivity': 'warn',
			'svelte/no-dom-manipulating': 'warn',
			'svelte/prefer-writable-derived': 'warn'
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
		ignores: ['build/', '.svelte-kit/', 'dist/']
	}
);
