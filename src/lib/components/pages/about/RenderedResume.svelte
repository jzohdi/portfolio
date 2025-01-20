<script lang="ts">
	import { setupCanvas, toCanvas } from '$lib/utils/htmlpaint/htmlpaint';
	import {
		appendStylesAndLinks,
		createIframeWithHtml,
		parseIframe
	} from '$lib/utils/htmlpaint/htmlParser';
	import { WebGLCanvasRenderer, type ZoomEventParams } from '$lib/utils/htmlpaint/webglRenderer';
	import { onDestroy, onMount } from 'svelte';
	import {
		Collapsible,
		CollapsibleContent,
		CollapsibleTrigger
	} from '$lib/components/ui/collapsible';
	import {
		pan,
		pinch,
		type PanCustomEvent,
		type GestureCustomEvent,
		type PinchCustomEvent
	} from 'svelte-gestures';

	let referrenceCanvas: HTMLCanvasElement | null = null;
	let webglCanvas: HTMLCanvasElement | null = $state(null);
	let renderer: WebGLCanvasRenderer | null = null;
	let iframe: HTMLIFrameElement | null = $state(null);
	let appenedToHead: (HTMLLinkElement | HTMLStyleElement)[] = $state([]);
	let isDragging = false;

	function handleMouseDown(event: { clientX: number; clientY: number }) {
		isDragging = true;
		if (renderer) {
			renderer.startPan(event);
		}
	}
	function panHandler(event: PanCustomEvent) {
		const x = event.detail.x;
		const y = event.detail.y;
		handleMouseMove({ clientX: x, clientY: y });
	}

	function panDown(gestureEvent: GestureCustomEvent) {
		const { x, y } = gestureEvent.detail;
		handleMouseDown({ clientX: x, clientY: y });
	}

	function handleMouseMove(event: { clientX: number; clientY: number }) {
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
				iframe = null;
			} catch (e) {
				console.log('no iframe to remove on destroy');
			}
		}
		if (appenedToHead.length > 0) {
			appenedToHead.forEach((tag) => {
				document.head.removeChild(tag);
			});
			appenedToHead = [];
		}
	});

	onMount(async () => {
		const results = await fetch('/files/resume.html');
		const htmlString = await results.text();
		iframe = await createIframeWithHtml(htmlString);
	});

	function zoomInWebgl(event: ZoomEventParams) {
		event.preventDefault();
		if (renderer && referrenceCanvas) {
			renderer.handleZoom(event);
			renderer.clear();
			renderer.render(referrenceCanvas);
		}
	}

	function handlePinch(event: PinchCustomEvent) {
		const { center, scale } = event.detail;
		const { x, y } = center;
		zoomInWebgl({ preventDefault: event.preventDefault, clientX: x, clientY: y, deltaY: scale });
	}

	async function completeRenderResume(
		referrenceIframe: HTMLIFrameElement,
		webglCanvas: HTMLCanvasElement
	) {
		const tree = await parseIframe(referrenceIframe);
		if (appenedToHead.length === 0) {
			appenedToHead = await appendStylesAndLinks(tree.headElements);
		}
		const targetWidth = webglCanvas.getBoundingClientRect().width;
		const { canvas, ctx, targetHeight } = setupCanvas(tree, targetWidth);

		webglCanvas.width = targetWidth;
		webglCanvas.height = targetHeight;

		renderer = new WebGLCanvasRenderer(webglCanvas);

		toCanvas(ctx, tree);
		renderer.render(canvas);
		referrenceCanvas = canvas;
	}

	$effect(() => {
		console.log({ iframe, webglCanvas });
		if (iframe && webglCanvas) {
			completeRenderResume(iframe, webglCanvas);
		}
	});
</script>

<canvas
	class="w-full rounded-md border-2 border-zinc-200 bg-black"
	bind:this={webglCanvas}
	onwheel={zoomInWebgl}
	use:pan={() => ({ delay: 0 })}
	onpan={panHandler}
	onpandown={panDown}
	onpanup={handleMouseUp}
	use:pinch={() => ({})}
	onpinch={handlePinch}
></canvas>
<div class="text-center">Zoom + Pan</div>
