<script lang="ts">
	import type { Snippet } from 'svelte';

	interface RowProps {
		top: 'left' | 'right';
		header?: string;
		description?: string;
		left: Snippet;
		right: Snippet;
	}
	let { top, header, description, left, right }: RowProps = $props();
</script>

<section
	class={`flex flex-row gap-5 ${top === 'right' ? 'flex-col-reverse lg:flex-row' : 'flex-wrap'}`}
>
	<div class="w-full flex-1 lg:w-[50%]">
		{@render left()}
	</div>
	<div class="w-full lg:w-[50%]">
		{@render right()}
	</div>
</section>
