<script lang="ts">
	import PostBlock from '$lib/components/pages/posts/PostBlock.svelte';
	import Spacer from '$lib/components/Spacer.svelte';
	import Text from '$lib/components/Text.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { ParsedBlock } from '$lib/notion/server';
	import type { Experiment } from '$lib/types/experiments';
	import { getImageSrc } from '$lib/utils/svelte-helper';
	import type { Snippet } from 'svelte';

	const {
		experiment,
		blocks,
		children
	}: { blocks: ParsedBlock[]; experiment: Experiment; children: Snippet } = $props();
	const { title, thumbnail, description } = experiment;

	let isExperimentRunning = $state(false);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
</svelte:head>

{#if isExperimentRunning}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
		style="height: 100svh;"
	>
		<div class="relative h-full w-full bg-white">
			<Button
				variant="secondary"
				class="absolute bottom-4 right-4 text-white"
				onclick={() => {
					isExperimentRunning = false;
				}}
			>
				Close
			</Button>
			<!-- Modal content goes here -->
			{@render children?.()}
		</div>
	</div>
{/if}

<Spacer height="50px" />
<section>
	<div class="m-auto max-w-xl">
		<img
			width={800}
			loading="eager"
			class="w-full"
			src={getImageSrc('experiments', thumbnail)}
			alt="thumbnail"
		/>
	</div>
</section>
<Spacer height="30px" />
<div class="flex items-center justify-between">
	<Text element="h1">{title}</Text>
	<Button
		variant="secondary"
		class="text-white"
		onclick={() => {
			isExperimentRunning = true;
		}}>Run</Button
	>
</div>
{#each blocks as block}
	<PostBlock {block}></PostBlock>
{/each}
