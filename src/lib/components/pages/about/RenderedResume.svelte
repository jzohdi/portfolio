<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import {  setupCanvas, toCanvas } from '$lib/utils/htmlpaint/htmlpaint';
	import { appendStyles, parse } from '$lib/utils/htmlpaint/htmlParser';
	import type { StyleNode } from '$lib/utils/htmlpaint/types';
	import { WebGLCanvasRenderer } from '$lib/utils/htmlpaint/webglRenderer';
	import { onDestroy, onMount } from 'svelte';

	let referrenceCanvas: HTMLCanvasElement | null = null;
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
			const targetWidth = webglCanvas.getBoundingClientRect().width;
			const { canvas, ctx, targetHeight } = setupCanvas(tree, targetWidth);

			webglCanvas.width = targetWidth;
			webglCanvas.height = targetHeight;

			renderer = new WebGLCanvasRenderer(webglCanvas);

			toCanvas(ctx, tree);
			// Render 2D canvas to WebGL canvas
			renderer.render(canvas);
			referrenceCanvas = canvas;

			// clean up iframe and style tags that loaded fonts
			document.body.removeChild(tree.iframe);
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

<canvas
	class="w-full touch-none bg-black border-2 border-zinc-200 rounded-md"
	bind:this={webglCanvas}
	on:wheel={zoomInWebgl}
	on:mousemove={handleMouseMove}
	on:mouseup={handleMouseUp}
	on:mousedown={handleMouseDown}
></canvas>
