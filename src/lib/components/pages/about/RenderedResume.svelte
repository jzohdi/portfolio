<script lang="ts">
	import { calculateHeight, toCanvas } from '$lib/utils/htmlpaint/htmlpaint';
	import { parse } from '$lib/utils/htmlpaint/htmlParser';
	import { WebGLCanvasRenderer } from '$lib/utils/htmlpaint/webglRenderer';
	import { onDestroy, onMount } from 'svelte';
	// import ThreeJsCube from '$lib/components/ThreeJsCube.svelte';

	let referrenceCanvas: HTMLCanvasElement | null = null;
	// let textureCanvas: HTMLCanvasElement | null = null;
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
			const heightOfTree = calculateHeight(tree);
			const aspectRatio = heightOfTree / tree.rect.width;
			webglCanvas.width = webglCanvas.getBoundingClientRect().width;
			webglCanvas.height = webglCanvas.width * aspectRatio;
			const newCanvas = document.createElement('canvas');
			newCanvas.width = webglCanvas.width * 2;
			newCanvas.height = webglCanvas.height * 2;

			renderer = new WebGLCanvasRenderer(webglCanvas, aspectRatio);
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
			// Render 2D canvas to WebGL canvas
			renderer.render(newCanvas);
			referrenceCanvas = newCanvas;
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
	class="w-full touch-none bg-black"
	bind:this={webglCanvas}
	on:wheel={zoomInWebgl}
	on:mousemove={handleMouseMove}
	on:mouseup={handleMouseUp}
	on:mousedown={handleMouseDown}
></canvas>
