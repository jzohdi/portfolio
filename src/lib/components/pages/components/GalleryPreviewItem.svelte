<script lang="ts">
	import GithubLogo from '$lib/components/icons/GithubLogo.svelte';
	import Spacer from '$lib/components/Spacer.svelte';
	import Text from '$lib/components/Text.svelte';
	import { getImageSrc } from '$lib/utils/svelte-helper';

	interface GalleryPreviewItemProps {
		title: string;
		description: string;
		link: string;
		source?: string;
		thumbnailSrc: string;
		action: 'open' | 'go';
	}

	const { title, description, link, source, thumbnailSrc, action }: GalleryPreviewItemProps =
		$props();

	let isDescriptionOpen = $state(false);

	function handleOpenDescription() {
		isDescriptionOpen = true;
	}
</script>

{#snippet leftChevron()}
	<svg
		width={20}
		height={20}
		xmlns="http://www.w3.org/2000/svg"
		class={`stroke-white transition-transform group-hover:translate-x-1`}
		fill="none"
		viewBox="0 0 24 24"
		stroke="currentColor"
	>
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" />
	</svg>
{/snippet}

{#snippet moreDetailsSection()}
	<div class="relative h-full">
		<Text element="h3">{title}</Text>
		<Spacer height="20px"></Spacer>
		<p class="sm:text-md text-sm text-gray-600">{description}</p>
		<div class="absolute bottom-0 flex w-full justify-between gap-2">
			{#if source !== undefined}
				<a href={source} target={action === 'open' ? '_blank' : ''} class="flex items-end pb-1">
					<GithubLogo width={32} height={32} />
				</a>
			{/if}
			<span class="flex gap-2">
				<button
					class="rounded-sm bg-zinc-300 px-4 py-2"
					onclick={() => {
						isDescriptionOpen = false;
					}}>Close</button
				>
				<a
					href={link}
					target="_blank"
					class="flex w-fit items-center rounded-sm bg-secondary px-4 py-2 text-white"
				>
					{action === 'open' ? 'Open' : 'Go'}
					{@render leftChevron()}
				</a>
			</span>
		</div>
	</div>
{/snippet}

<div class="group relative block overflow-hidden border-2 border-black p-0">
	<button aria-label="show details" onclick={handleOpenDescription} class="w-full">
		<div class="relative flex h-64 items-center justify-center overflow-hidden">
			<img
				alt={`thumbnail for ${title}`}
				src={thumbnailSrc}
				class="h-full w-full object-cover object-center"
				width={192}
			/>
		</div>
		<div
			class="absolute bottom-0 left-0 flex h-6 w-full justify-center border-t-2 bg-white text-zinc-700 transition-all group-hover:h-10 group-hover:border-secondary group-hover:text-secondary"
		>
			Show Details
		</div>
	</button>
	<div
		class={`absolute left-0 h-full w-full bg-white p-2 text-left text-black transition-all ${isDescriptionOpen ? 'top-0' : 'top-80'}`}
	>
		{@render moreDetailsSection()}
	</div>
</div>
