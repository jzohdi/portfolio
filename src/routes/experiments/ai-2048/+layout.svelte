<script lang="ts">
	import ExperimentLayout from '$lib/components/pages/experiments/ExperimentLayout.svelte';
	import type { ParsedBlock } from '$lib/notion/server';
	import type { Experiment } from '$lib/types/experiments';
	import type { Snippet } from 'svelte';

	let {
		data,
		children
	}: { data: { blocks: ParsedBlock[]; experiment: Experiment }; children: Snippet } = $props();
</script>

<!-- <ExperimentLayout experiment={data.experiment} blocks={data.blocks}> -->
{@render children?.()}
<!-- </ExperimentLayout> -->
