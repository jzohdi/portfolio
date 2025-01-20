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
	let device: GPUDevice, context: GPUCanvasContext, format: GPUTextureFormat;

	function resizeCanvas(canvas: HTMLCanvasElement) {
		const devicePixelRatio = window.devicePixelRatio || 1;
		const width = window.innerWidth;
		const height = window.innerHeight - 60;
		canvasDimensions = {
			width: Math.floor(width * devicePixelRatio),
			height: Math.floor(height * devicePixelRatio)
		};
	}

	async function loadExample() {
		if (cleanupFn) {
			cleanupFn(); // Cleanup previous example
		}

		cleanupFn = await animationFunction(device, context, format);
	}
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

	onMount(async () => {
		if (!canvas) {
			return;
		}
		resizeCanvas(canvas);
		const init = await initWebGPU(canvas);
		device = init.device;
		context = init.context;
		format = init.format;

		// Configure initially
		resizeCanvasAndConfigure();
		window.onresize = () => {
			resizeCanvasAndConfigure();
		};
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
	class="fixed left-[20px] top-[60px] w-[100vw] sm:top-[72px]"
	bind:this={canvas}
></canvas>
