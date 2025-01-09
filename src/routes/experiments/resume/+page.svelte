<script lang="ts">
	import Spacer from '$lib/components/Spacer.svelte';
	import { toCanvas } from '$lib/utils/htmlpaint/htmlpaint';
	import { parse } from '$lib/utils/htmlpaint/htmlParser';
	import { type AstNode } from '$lib/utils/htmlpaint/types';
	import { type ParsedHtml } from '$lib/utils/htmlpaint/types';
	import { WebGLCanvasRenderer } from '$lib/utils/htmlpaint/webglRenderer';
	import { onDestroy, onMount } from 'svelte';

	let canvas: HTMLCanvasElement | null = null;
	let webglCanvasContainer: HTMLDivElement | null = null;
	let webglCanvas: HTMLCanvasElement | null = null;
	// let gl: WebGLRenderingContext;
	// let program: WebGLProgram;
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
		if (isDragging && renderer && canvas) {
			renderer.panTo(event);
			renderer.clear();
			renderer.render(canvas);
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
			canvas = document.createElement('canvas');
			canvas.width = webglCanvas.width * 2;
			canvas.height = webglCanvas.height * 2;
			renderer = new WebGLCanvasRenderer(webglCanvas);
			const results = await fetch('/files/resume.html');
			const htmlString = await results.text();
			const tree = await parse(htmlString);
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				return;
			}
			// Start rendering from the body
			const widthScale = canvas.width / tree.rect.width;
			ctx.scale(widthScale, widthScale);
			const fullHeight = toCanvas(ctx, tree);
			// console.log(fullHeight);
			const aspectRatio = fullHeight / tree.rect.width;
			// console.log({ aspectRatio });
			const containerHeight = webglCanvas.width * aspectRatio;
			if (webglCanvasContainer) {
				webglCanvasContainer.style.overflow = 'hidden';
				webglCanvasContainer.style.height = `${containerHeight}px`;
			}

			document.body.removeChild(tree.iframe);
			// Render 2D canvas to WebGL canvas
			renderer.render(canvas);
		}
	});

	function zoomInWebgl(event: WheelEvent) {
		event.preventDefault();
		if (renderer && canvas) {
			renderer.handleZoom(event);
			renderer.clear();
			renderer.render(canvas);
		}
	}

	function isCanvasElement(canvas: HTMLCanvasElement | null): canvas is HTMLCanvasElement {
		return canvas !== null;
	}
</script>

<div class="h-full w-full">
	<!-- <canvas width={2048} height={4096} class="bg-white" bind:this={canvas}></canvas> -->
	<div bind:this={webglCanvasContainer}>
		<canvas
			width={1024}
			height={2048}
			class="touch-none bg-white"
			bind:this={webglCanvas}
			on:wheel={zoomInWebgl}
			on:mousemove={handleMouseMove}
			on:mouseup={handleMouseUp}
			on:mousedown={handleMouseDown}
		></canvas>
	</div>
	<Spacer height="100px"></Spacer>
</div>
