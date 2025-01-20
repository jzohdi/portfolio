<script lang="ts">
	import ExperimentsSideBar from '$lib/components/pages/experiments/ExperimentsSideBar.svelte';
	import { initWebGPU } from '$lib/utils/experiments/gpu/initWebgpu.js';
	import type { MainFunction } from '$lib/utils/experiments/gpu/types';
	import { onDestroy, onMount } from 'svelte';

	interface FullScreenCanvasProps {
		animationFunction: MainFunction;
	}

	const { animationFunction }: FullScreenCanvasProps = $props();

	let canvasDimensions = $state({
		width: 0,
		height: 0
	});

	let canvas: HTMLCanvasElement | null = null;
	let cleanupFn: (() => void) | null = null;

	function resizeCanvas(canvas: HTMLCanvasElement) {
		const devicePixelRatio = window.devicePixelRatio || 1;
		const width = canvas.offsetWidth;
		const height = canvas.offsetHeight;
		canvasDimensions = {
			width: Math.floor(width * devicePixelRatio),
			height: Math.floor(height * devicePixelRatio)
		};
	}

	onMount(async () => {
		if (!canvas) {
			return;
		}
		resizeCanvas(canvas);
		const { device, context, format } = await initWebGPU(canvas);

		function resizeCanvasAndConfigure() {
			if (!canvas) {
				return;
			}
			resizeCanvas(canvas);
			context.configure({
				device,
				format: navigator.gpu.getPreferredCanvasFormat(),
				alphaMode: 'premultiplied'
			});
			loadExample();
		}

		async function loadExample() {
			if (cleanupFn) {
				cleanupFn(); // Cleanup previous example
			}

			cleanupFn = await animationFunction(device, context, format);
		}

		// Configure initially
		resizeCanvasAndConfigure();
	});

	onDestroy(() => {
		if (cleanupFn !== null) {
			cleanupFn(); // Cleanup previous example
		}
	});
</script>

<canvas
	width={canvasDimensions.width}
	height={canvasDimensions.height}
	class="h-[calc(100vh - 60px)] fixed top-[60px] w-full sm:top-[72px] sm:h-[calc(100vh-72px)]"
	bind:this={canvas}
></canvas>
