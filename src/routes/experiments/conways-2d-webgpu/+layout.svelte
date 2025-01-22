<script lang="ts">
	import ErrorAnimation from '$lib/components/ErrorAnimation.svelte';
	import ExperimentsSideBar from '$lib/components/pages/experiments/ExperimentsSideBar.svelte';

	let { children, data } = $props();
	let error: { message: string } | null = $state(null);
	let reset = $state(() => {});

	const experiments = data.experiments;
	function onerror(e: unknown, r: () => void) {
		error = e as { message: string };
		const message = error.message.split('\n')[0];
		console.log({ message });
		reset = r;
	}

	function tryGetErrorMessage() {
		console.error(error?.message?.split('\n')?.[0]);
		return 'Error';
	}
</script>

<ExperimentsSideBar {experiments} />
<ErrorAnimation message={tryGetErrorMessage()} />
<svelte:boundary {onerror}>{@render children?.()}</svelte:boundary>

{#if error}
	<ExperimentsSideBar {experiments} />

	<div class=" content-center justify-items-center text-white">{tryGetErrorMessage()}</div>
{/if}
