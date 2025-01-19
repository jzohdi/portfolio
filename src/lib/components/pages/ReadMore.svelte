<script lang="ts">
	import Text from '../Text.svelte';

</script>


<Text element="p" class="duration-400 flex items-center group-hover:text-secondary group"
	>Read more <svg
	xmlns="http://www.w3.org/2000/svg"
	class={`duration-400 h-4 w-4 transition-transform group-hover:translate-x-1`}
	fill="none"
	viewBox="0 0 24 24"
	stroke="currentColor"
>
	<path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" />
	</svg>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		class={`duration-600 ml-[-3px] group-hover:ml-0 h-4 w-4 transition-all group-hover:translate-x-1 opacity-0 group-hover:opacity-100`}
		fill="none"
		viewBox="0 0 24 24"
		stroke="currentColor"
	>
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" />
	</svg>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		class={`duration-800 ml-[-8px] group-hover:ml-0 h-4 w-4 transition-all group-hover:translate-x-1 opacity-0 group-hover:opacity-100`}
		fill="none"
		viewBox="0 0 24 24"
		stroke="currentColor"
	>
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" />
	</svg>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		class={`duration-900 ml-[-12px] group-hover:ml-0 h-4 w-4 transition-all group-hover:translate-x-1 opacity-0 group-hover:opacity-100`}
		fill="none"
		viewBox="0 0 24 24"
		stroke="currentColor"
	>
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" />
	</svg>
</Text>
