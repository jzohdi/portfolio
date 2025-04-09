<script lang="ts">
	import Spacer from '$lib/components/Spacer.svelte';
	import Text from '$lib/components/Text.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import WebGlGraphingCalculator from '$lib/utils/experiments/webgl/graphing-calculator';
	import { onMount } from 'svelte';

	let canvasElement: HTMLCanvasElement;
	// let functionString: string | null = null;
	let xCoordinate: number = 0;
	let yCoordinate: number = 0;
	let graphingModule: WebGlGraphingCalculator | null = null;
	// Set up the ResizeObserver to track the element.
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
		// Create the observer and observe the element.
		resizeObserver = new ResizeObserver(() => {
			handleResize();
		});
		resizeObserver.observe(formElement);

		// Cleanup on component destroy.
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
		// Prevent the default form submission behavior
		e.preventDefault();

		// Access the form inputs by their id
		const form = e.currentTarget;

		// Get the function value
		const functionInput = form.querySelector('#function') as HTMLInputElement;
		const functionValue = functionInput?.value || '';

		// Get the x coordinate value
		const xCoordinateInput = form.querySelector('#x-coordinate') as HTMLInputElement;
		const xCoordinate = xCoordinateInput?.value ? parseFloat(xCoordinateInput.value) : 0;

		console.log({
			function: functionValue,
			xCoordinate,
			yCoordinate
		});

		// Now you can use these values
		if (graphingModule !== null) {
			const parsed = graphingModule.setFormula(functionValue);
			if (parsed) {
				graphingModule.graphFormula(xCoordinate);
				derivative = parsed.derivativeString;
			}
			// Add any additional functionality with the coordinates
		}
	}

	function handleResize() {
		if (!graphingModule || !formElement) {
			return;
		}
		const { width } = formElement.getBoundingClientRect();
		const { height } = canvasElement.getBoundingClientRect();
		graphingModule.handleResize(width, height, xCoordinate);
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
			<Input class="w-14" type="number" name="x-coordinate" id="x-coordinate" placeholder="0" />
		</span>
		<span style="flex: 0 0 auto;">
			<Label for="y-coordinate">y</Label>
			<Input class="w-14" type="number" name="y-coordinate" id="y-coordinate" placeholder="0" />
		</span>
		<dl class="flex-auto text-xs">
			<dt>derivative</dt>
			<dd>{derivative}</dd>
		</dl>
	</div>
	<Spacer height="10px" />
	<Spacer height="10px" />
	<canvas class="min-h-0 flex-1 bg-black" bind:this={canvasElement}></canvas>
	<Spacer height="15px" />
</form>
