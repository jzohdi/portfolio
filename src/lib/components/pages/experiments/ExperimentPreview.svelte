<script lang="ts">
	import CancelCircleIcon from '$lib/components/icons/CancelCircleIcon.svelte';
	import FileOrDirectory from '$lib/components/pages/experiments/FileOrDirectory.svelte';
	import Spacer from '$lib/components/Spacer.svelte';
	import Text from '$lib/components/Text.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { makeDirectories } from '$lib/utils/experiments/makeDirectories.js';
	import { getImageSrc } from '$lib/utils/svelte-helper';

	const { experiment } = $props();
	let isPreviewOpen = $state(false);

	function handleOpenPreview() {
		isPreviewOpen = true;
	}
</script>

<Text element="li">
	<Text element="h2">{experiment.title}</Text>
	<div class="grid grid-cols-3">
		<div class="col-span-1 hidden sm:block">
			<div class="relative flex h-full w-full overflow-hidden">
				<img
					src={getImageSrc('experiments', experiment.thumbnail)}
					width={200}
					class="object-cover object-center"
					alt={`thumbnail for ${experiment.title}`}
				/>
			</div>
		</div>
		<div
			class="relative col-span-3 flex h-full flex-col justify-between gap-5 overflow-hidden p-5 sm:col-span-2"
		>
			{#if isPreviewOpen}
				<div class="absolute left-0 top-0 flex h-full w-full bg-white">
					<div class="relative h-full w-full">
						<img
							src={getImageSrc('experiments', experiment.thumbnail)}
							width={200}
							class="h-full w-full object-cover object-center"
							alt={`thumbnail for ${experiment.title}`}
						/>
						<Button
							class="absolute bottom-2 right-2"
							variant="secondary"
							onclick={() => {
								isPreviewOpen = false;
							}}
						>
							<CancelCircleIcon class="fill-white" width={20} height={20} />
						</Button>
					</div>
				</div>
			{/if}
			<Text element="p" class="!mt-0">{experiment.description}</Text>
			<div class="flex justify-end gap-5">
				<Button variant="outline" class="sm:hidden" onclick={handleOpenPreview}>Show Preview</Button
				>
				<a
					href={experiment.path}
					class="flex w-fit items-center rounded-sm bg-secondary px-4 py-2 text-white"
				>
					Go <span class="hidden sm:inline-block">To Page</span>
				</a>
			</div>
		</div>
	</div>
</Text>
<Spacer height="20px"></Spacer>
