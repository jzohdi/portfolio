<script lang="ts">
	import Spacer from '$lib/components/Spacer.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { getCanvasCoords } from '$lib/utils/experiments/utils/coordinates';
	import WebGlGraphingCalculator from '$lib/utils/experiments/webgl/graphing-calculator';
	import { onMount } from 'svelte';

	let canvasElement: HTMLCanvasElement;
	// let functionString: string | null = null;
	let xCoordinate: number = $state(0);
	let yCoordinate: number = $state(0);
	let graphingModule: WebGlGraphingCalculator | null = null;
	let resizeObserver: ResizeObserver | null = null;
	let formElement: HTMLFormElement;
	let derivative: string = $state('');

	onMount(() => {
		if (!canvasElement || graphingModule !== null) {
			return;
		}
		try {
			graphingModule = new WebGlGraphingCalculator(canvasElement);
		} catch (e: unknown) {
			if (typeof e === 'string') {
				alert(e);
			} else if (e instanceof Error) {
				alert(e.message);
			}
		}

		if (!formElement) {
			return;
		}

		resizeObserver = new ResizeObserver(() => {
			handleResize();
		});
		resizeObserver.observe(formElement);

		return () => {
			if (resizeObserver && formElement) {
				resizeObserver.unobserve(formElement);
				resizeObserver.disconnect();
			}
		};
	});

	function handleSubmit(
		e: SubmitEvent & {
			currentTarget: EventTarget & HTMLFormElement;
		}
	) {
		e.preventDefault();

		const form = e.currentTarget;
		const functionInput = form.querySelector('#function') as HTMLInputElement;
		const functionValue = functionInput?.value || '';
		const xCoordinateInput = form.querySelector('#x-coordinate') as HTMLInputElement;
		const xCoordinate = xCoordinateInput?.value ? parseFloat(xCoordinateInput.value) : 0;

		if (graphingModule !== null) {
			const parsed = graphingModule.setFormula(functionValue);
			if (parsed) {
				handleChangeX(xCoordinate);
				derivative = parsed.derivativeString ?? '';
			}
		}
	}

	function handleResize() {
		if (!graphingModule || !formElement) {
			return;
		}
		const { width } = formElement.getBoundingClientRect();
		const { height } = canvasElement.getBoundingClientRect();
		graphingModule.handleResize(width, height);
	}

	function handleChangeX(x: number) {
		if (!graphingModule) {
			return;
		}
		xCoordinate = +x.toFixed(2);
		const formula = graphingModule.getFormula();
		const y = formula?.formula.evaluate({ x: xCoordinate });
		yCoordinate = y;
		graphingModule.setTangentPoint(xCoordinate);
	}

	function handleMouseCoords(e: MouseEvent | TouchEvent) {
		if (!graphingModule) {
			return;
		}
		const { x, y, ...rest } = getCanvasCoords(e);
		const relative = graphingModule.mapToRelativeCoordinate({ x, y }, rest);
		handleChangeX(relative.x);
	}
</script>

<form
	onsubmit={handleSubmit}
	class="m-auto flex h-full flex-col"
	style="width: 800px; max-width: 90%"
	bind:this={formElement}
>
	<Spacer height="15px" />
	<div class="flex items-end gap-3">
		<span class="flex-1">
			<Label for="function">Function</Label>
			<Input type="text" name="function" id="function" placeholder="(x^2 - 1)/sin(x)" />
		</span>
		<Button variant="secondary" type="submit">Submit</Button>
	</div>
	<Spacer height="10px" />
	<div class="flex flex-wrap items-center gap-5">
		<span style="flex: 0 0 auto;">
			<Label for="x-coordinate">x</Label>
			<Input
				onchange={(e) => {
					try {
						const num = parseFloat(e.currentTarget.value);
						handleChangeX(num);
					} catch (e) {
						console.log(e);
					}
				}}
				value={xCoordinate}
				class="w-24"
				type="number"
				name="x-coordinate"
				id="x-coordinate"
				step={0.01}
				placeholder="0.00"
			/>
		</span>
		<span style="flex: 0 0 auto;">
			<Label for="y-coordinate">y</Label>
			<Input
				value={yCoordinate}
				class="w-24"
				type="float"
				name="y-coordinate"
				id="y-coordinate"
				placeholder="0"
			/>
		</span>
		<dl class="flex-auto text-xs">
			<dt>derivative</dt>
			<dd>{derivative}</dd>
		</dl>
	</div>
	<Spacer height="10px" />
	<Spacer height="10px" />
	<canvas
		ontouchmove={(e) => handleMouseCoords(e)}
		onmousemove={handleMouseCoords}
		class="min-h-0 flex-1 bg-black"
		bind:this={canvasElement}
	></canvas>
	<Spacer height="15px" />
</form>
