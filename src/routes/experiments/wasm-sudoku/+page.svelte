<script lang="ts">
	import { loadMain } from '$lib/utils/experiments/wasm/add';
	// Extend the global Window interface so TypeScript recognizes our Module.
	// declare global {
	// 	interface Window {
	// 		Module: any; // You can replace `any` with a more specific type if available.
	// 	}
	// }
	import { onMount } from 'svelte';

	let output = '';

	// Helper function to load a script dynamically.
	function loadScript(src: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = src;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
			document.body.appendChild(script);
		});
	}

	onMount(async () => {
		const wasm = await loadMain();
		const result = wasm.add(100, 369);
		const sumAr = wasm.sumArray([1, 2, 3, 4, 5]);
		console.log('sumAr:', sumAr);
		// if (window.Module !== undefined) {
		// 	return;
		// }
		// // Load the Emscripten module from static/sudoku/sudoku.js
		// await loadScript('/sudoku/sudoku.js');
		// // Now window.Module should be available.
		// const Module = window.Module;
		// // Once the runtime is initialized, call main.
		// // Module.cwrap('int_sqrt', 'number', ['number'])
		// Module.onRuntimeInitialized = () => {
		// 	// Module.arguments = [
		// 	// 	'line',
		// 	// 	'000000000302540000050301070000000004409006005023054790000000050700810000080060009'
		// 	// ];
		// 	console.log(
		// 		Module.ccall(
		// 			'solve',
		// 			'number',
		// 			['string'],
		// 			['000000000302540000050301070000000004409006005023054790000000050700810000080060009']
		// 		)
		// 	);
		// };
	});
</script>

<div>hello world</div>
