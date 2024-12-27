<script lang="ts">
	import type { Snippet } from 'svelte';

	interface RowProps {
		top: 'left' | 'right';
		bp: 'xs' | 'sm' | 'md' | 'lg';
		header?: string;
		description?: string;
		left: Snippet;
		right: Snippet;
	}
	let { top, bp, header, description, left, right }: RowProps = $props();
</script>

<section
	class={`flex flex-row gap-5 ${top === 'right' ? `flex-col-reverse ${bp}:flex-row` : 'flex-wrap'}`}
>
	<div class={`w-full flex-1 ${bp}:w-[50%]`}>
		{@render left()}
	</div>
	<div class={`w-full ${bp}:w-[50%]`}>
		{@render right()}
	</div>
</section>
