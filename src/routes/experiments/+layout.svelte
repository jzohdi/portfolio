<script lang="ts">
	import ExperimentsSideBar from '$lib/components/pages/experiments/ExperimentsSideBar.svelte';

	let { children, data } = $props();

	const experiments = data.experiments;
</script>

<ExperimentsSideBar {experiments} />
{@render children?.()}
