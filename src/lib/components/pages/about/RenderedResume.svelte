<script lang="ts">
	import {
		Collapsible,
		CollapsibleContent,
		CollapsibleTrigger
	} from '$lib/components/ui/collapsible';
	import ResumeVinyl from './ResumeVinyl.svelte';

</script>

<Collapsible class="w-full">
	<CollapsibleTrigger
		class="w-full rounded bg-pink-700 px-4 py-2 text-white hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-300"
		>Render Resume</CollapsibleTrigger
	>
	<CollapsibleContent>
		<ResumeVinyl />
		<div class="text-center text-sm text-gray-500 mt-2 italic">Double click vinyl to flip</div>
	</CollapsibleContent>
</Collapsible>
