<script lang="ts">
	import { parse, type AstNode, type ParsedHtml } from '$lib/utils/htmlpaint';
	import { setupGl, setupWebglProgram, webglPaper } from '$lib/utils/webglPaper';
	import { WebGLCanvasRenderer } from '$lib/utils/webglRenderer';
	import { onDestroy, onMount } from 'svelte';

	let canvas: HTMLCanvasElement | null = null;
	let webglCanvas: HTMLCanvasElement | null = null;
	let zoom = 1;
	// let gl: WebGLRenderingContext;
	// let program: WebGLProgram;
	let renderer: WebGLCanvasRenderer | null = null;

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
	});

	onMount(async () => {
		if (isCanvasElement(canvas) && isCanvasElement(webglCanvas)) {
			renderer = new WebGLCanvasRenderer(webglCanvas);
			const results = await fetch('/files/resume.html');
			const htmlString = await results.text();
			const tree = await parse(htmlString);
			console.log(tree);
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				return;
			}
			// Start rendering from the body
			renderElement(ctx, tree, 10, 30);
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

	function renderElement(ctx: CanvasRenderingContext2D, tree: ParsedHtml, x: number, y: number) {
		let currentY = y;
		for (const row of tree.parsedBody) {
			// console.log(row.rect);
			if (row.rect && row.styles) {
				// console.log(row, row.rect);
				renderRow(ctx, row, x, currentY);
				currentY += row.rect.height / 4 + parseInt(row.styles.lineHeight) / 2;
				// console.log({ y });
			} else {
				throw new Error('should not get here');
			}
		}
	}
	function renderRow(
		ctx: CanvasRenderingContext2D,
		row: AstNode,
		x: number,
		y: number,
		fontSize?: number
	) {
		const element = row.element;
		if (row.type === 'string' && element.textContent !== null) {
			const coords = element.parentElement?.getBoundingClientRect();
			if (coords) {
				ctx.textBaseline = 'top';
				ctx.fillText(element.textContent, x, y - (fontSize ?? 0));
				return x + coords.width;
			} else {
				return x;
			}
		} else {
			let fontS = undefined;
			if (row.styles && row.rect) {
				ctx.font = `${row.styles.fontSize} ${row.styles.fontFamily}`;
				ctx.fillStyle = row.styles.color;
				fontS = parseInt(row.styles.fontSize);
			}
			Array.from(row.children).forEach((child) => {
				x = renderRow(ctx, child, x, y, fontS);
			});
			return x;
		}
	}
</script>

<div class="h-full w-full">
	<canvas width={1024} height={2048} class="bg-white" bind:this={canvas}></canvas>
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
