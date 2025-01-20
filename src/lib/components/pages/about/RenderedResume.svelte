<script lang="ts">
	import { setupCanvas, toCanvas } from '$lib/utils/htmlpaint/htmlpaint';
	import {
		appendStylesAndLinks,
		createIframeWithHtml,
		parse,
		parseIframe
	} from '$lib/utils/htmlpaint/htmlParser';
	import { WebGLCanvasRenderer } from '$lib/utils/htmlpaint/webglRenderer';
	import { onDestroy, onMount } from 'svelte';
	import type { TouchEventHandler } from 'svelte/elements';
	import {
		Collapsible,
		CollapsibleContent,
		CollapsibleTrigger
	} from '$lib/components/ui/collapsible';

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
	const handleTouchDown: TouchEventHandler<HTMLCanvasElement> = (e) => {
		const touch = e.touches[0];
		handleMouseDown(touch);
	};

	const handleTouchStart: TouchEventHandler<HTMLCanvasElement> = (e) => {
		const touch = e.touches[0];
		handleMouseMove(touch);
	};

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

	function zoomInWebgl(event: WheelEvent) {
		event.preventDefault();
		if (renderer && referrenceCanvas) {
			renderer.handleZoom(event);
			renderer.clear();
			renderer.render(referrenceCanvas);
		}
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

<Collapsible class="w-full">
	<CollapsibleTrigger
		class="w-full rounded bg-pink-700 px-4 py-2 text-white hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-300"
		>Render Resume</CollapsibleTrigger
	>
	<CollapsibleContent>
		<canvas
			class="w-full touch-none rounded-md border-2 border-zinc-200 bg-black"
			bind:this={webglCanvas}
			onwheel={zoomInWebgl}
			onmousemove={handleMouseMove}
			onmouseup={handleMouseUp}
			onmousedown={handleMouseDown}
			ontouchstart={handleTouchDown}
			ontouchend={handleMouseUp}
			ontouchmove={handleTouchStart}
		></canvas>
		<div class="text-center">Zoom + Pan</div>
	</CollapsibleContent>
</Collapsible>
