<script lang="ts">
	import ErrorAnimation from '$lib/components/ErrorAnimation.svelte';

	let { children } = $props();
	let error: { message: string } | null = $state(null);
	let reset = $state(() => {});

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

<ErrorAnimation message={tryGetErrorMessage()} />
<svelte:boundary {onerror}>{@render children?.()}</svelte:boundary>
