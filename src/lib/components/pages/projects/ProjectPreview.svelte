<script lang="ts">
	import { getImageSrc } from '$lib/utils/svelte-helper';
	import GalleryPreviewItem from '../components/GalleryPreviewItem.svelte';

	const { project } = $props();
</script>

<GalleryPreviewItem
	title={project.title}
	description={project.description}
	action="open"
	source={project.source}
	thumbnailSrc={getImageSrc('projects', project.thumbnail)}
	link={project.link}
/>
