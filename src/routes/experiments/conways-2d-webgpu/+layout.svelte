<script lang="ts">
	import ExperimentLayout from '$lib/components/pages/experiments/ExperimentLayout.svelte';
	import PostBlock from '$lib/components/pages/posts/PostBlock.svelte';
	import Spacer from '$lib/components/Spacer.svelte';
	import Text from '$lib/components/Text.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { ParsedBlock } from '$lib/notion/server';
	import type { Experiment } from '$lib/types/experiments';
	import { getImageSrc } from '$lib/utils/svelte-helper';
	import type { Snippet } from 'svelte';

	let {
		data,
		children
	}: { data: { blocks: ParsedBlock[]; experiment: Experiment }; children: Snippet } = $props();
</script>

<ExperimentLayout experiment={data.experiment} blocks={data.blocks}>
	{@render children?.()}
</ExperimentLayout>
