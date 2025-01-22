<script lang="ts">
	import FullScreenCanvas from '$lib/components/pages/experiments/FullScreenCanvas.svelte';
	import { main } from '$lib/utils/experiments/gpu/conways-2d';
</script>

<FullScreenCanvas animationFunction={main} />
