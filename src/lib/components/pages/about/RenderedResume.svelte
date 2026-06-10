<script lang="ts">
	import {
		Collapsible,
		CollapsibleContent,
		CollapsibleTrigger
	} from '$lib/components/ui/collapsible';
	import StarFoxResume from '$lib/components/starfox/StarFoxResume.svelte';
</script>

<Collapsible class="w-full">
	<CollapsibleTrigger
		class="w-full rounded bg-pink-700 px-4 py-2 text-white hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-300"
		>Render Resume</CollapsibleTrigger
	>
	<CollapsibleContent>
		<StarFoxResume />
		<div class="text-center text-sm text-gray-500 mt-2 italic">
			Shoot the core to fly through my resume
		</div>
	</CollapsibleContent>
</Collapsible>
