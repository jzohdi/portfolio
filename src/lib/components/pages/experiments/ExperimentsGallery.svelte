<script lang="ts">
	import Text from '$lib/components/Text.svelte';
	import type { Experiment } from '$lib/types/experiments';
	import { getImageSrc } from '$lib/utils/svelte-helper';
	import GalleryPreviewItem from '../components/GalleryPreviewItem.svelte';

	interface ExperimentsGalleryProps {
		experiments: Experiment[];
	}
	const { experiments }: ExperimentsGalleryProps = $props();
</script>

<section>
	<div class="grid grid-cols-1 gap-10 pb-10 md:grid-cols-2">
		<Text element="h2" class="text-left md:text-right">Experiments</Text>
		<span></span>
	</div>
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each experiments as experiment}
			<GalleryPreviewItem
				title={experiment.title}
				thumbnailSrc={getImageSrc('experiments', experiment.thumbnail)}
				description={experiment.description}
				link={experiment.path}
				action="go"
			/>
		{/each}
	</div>
</section>
