<script lang="ts">
	import ExperimentsSideBar from '$lib/components/pages/experiments/ExperimentsSideBar.svelte';
	import FullScreenCanvas from '$lib/components/pages/experiments/FullScreenCanvas.svelte';
	import { main } from '$lib/utils/experiments/gpu/conways-2d';

	const { data } = $props();

	const experiments = data.experiments;
</script>

<ExperimentsSideBar {experiments} />
<FullScreenCanvas animationFunction={main} />
