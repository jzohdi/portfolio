<script lang="ts">
	import Text from '$lib/components/Text.svelte';
	import ProjectPreview from './ProjectPreview.svelte';

	const { projects } = $props();
</script>

<section>
	<div class="grid grid-cols-1 gap-10 pb-10 md:grid-cols-2">
		<span></span>
		<Text element="h2" class="">Projects</Text>
	</div>
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each projects as project}
			<ProjectPreview {project} />
		{/each}
	</div>
</section>
