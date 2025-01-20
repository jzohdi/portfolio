<script lang="ts">
	import Spacer from '$lib/components/Spacer.svelte';
	import { calculateHeight, toCanvas } from '$lib/utils/htmlpaint/htmlpaint';
	import { appendStylesAndLinks, parse } from '$lib/utils/htmlpaint/htmlParser';
	import { WebGLCanvasRenderer } from '$lib/utils/htmlpaint/webglRenderer';
	import { onDestroy, onMount } from 'svelte';
	import ThreeJsCube from '$lib/components/ThreeJsCube.svelte';
	import type { LinkNode, StyleNode } from '$lib/utils/htmlpaint/types';

	let referrenceCanvas: HTMLCanvasElement | null = null;
	let textureCanvas: HTMLCanvasElement | null = null;
	let webglCanvasContainer: HTMLDivElement | null = null;
	let webglCanvas: HTMLCanvasElement | null = null;
	let renderer: WebGLCanvasRenderer | null = null;
	let iframe: HTMLIFrameElement | null = null;
	let isDragging = false;

	function handleMouseDown(event: MouseEvent) {
		isDragging = true;
		if (renderer) {
			renderer.startPan(event);
		}
	}

	function handleMouseMove(event: MouseEvent) {
		if (isDragging && renderer && referrenceCanvas) {
			renderer.panTo(event);
			renderer.clear();
			renderer.render(referrenceCanvas);
		}
	}

	function handleMouseUp() {
		isDragging = false;
	}

	onDestroy(() => {
		if (renderer !== null) {
			renderer.clear();
		}
		if (iframe) {
			try {
				document.body.removeChild(iframe);
			} catch (e) {
				console.log('no iframe to remove on destroy');
			}
		}
	});

	onMount(async () => {
		if (isCanvasElement(webglCanvas)) {
			const results = await fetch('/files/resume.html');
			const htmlString = await results.text();
			const tree = await parse(htmlString);
			const headTagsToRemove = await appendStylesAndLinks(tree.headElements);
			const heightOfTree = calculateHeight(tree);
			const targetWidth = webglCanvas.getBoundingClientRect().width;
			const aspectRatio = heightOfTree / tree.rect.width;
			// const { width, height } =
			webglCanvas.width = targetWidth;
			const targetHeight = targetWidth * aspectRatio;
			webglCanvas.height = targetHeight;

			const newCanvas = document.createElement('canvas');
			newCanvas.width = targetWidth * 2;
			newCanvas.height = targetHeight * 2;

			renderer = new WebGLCanvasRenderer(webglCanvas);
			const ctx = newCanvas.getContext('2d');
			if (!ctx) {
				return;
			}
			// Start rendering from the body
			const widthScale = newCanvas.width / tree.rect.width;
			ctx.fillStyle = 'white';
			ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
			ctx.scale(widthScale, widthScale);
			toCanvas(ctx, tree);
			referrenceCanvas = newCanvas;

			const containerHeight = webglCanvas.width * aspectRatio;
			const canvasForThreeJs = document.createElement('canvas');
			canvasForThreeJs.width = referrenceCanvas.width;
			canvasForThreeJs.height = referrenceCanvas.width * aspectRatio;
			const textureCtx = canvasForThreeJs.getContext('2d');
			if (textureCtx) {
				textureCanvas = canvasForThreeJs;
				textureCtx.drawImage(
					referrenceCanvas,
					0,
					0,
					referrenceCanvas.width,
					canvasForThreeJs.height,
					0,
					0,
					referrenceCanvas.width,
					canvasForThreeJs.height
				);
			}

			// document.body.removeChild(tree.iframe);
			// Render 2D canvas to WebGL canvas
			headTagsToRemove.forEach((tag) => {
				document.head.removeChild(tag);
			});
			renderer.render(newCanvas);
		}
	});

	function zoomInWebgl(event: WheelEvent) {
		event.preventDefault();
		if (renderer && referrenceCanvas) {
			renderer.handleZoom(event);
			renderer.clear();
			renderer.render(referrenceCanvas);
		}
	}

	function isCanvasElement(canvas: HTMLCanvasElement | null): canvas is HTMLCanvasElement {
		return canvas !== null;
	}
</script>

<div class="h-full w-full">
	<canvas
		class="w-[90vw] max-w-[600px] touch-none bg-black"
		bind:this={webglCanvas}
		on:wheel={zoomInWebgl}
		on:mousemove={handleMouseMove}
		on:mouseup={handleMouseUp}
		on:mousedown={handleMouseDown}
	></canvas>
	<Spacer height="100px"></Spacer>
	{#if textureCanvas !== null}
		<ThreeJsCube {textureCanvas} />
	{/if}
</div>
