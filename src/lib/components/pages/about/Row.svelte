<script lang="ts">
	import Spacer from '$lib/components/Spacer.svelte';
import Text from '$lib/components/Text.svelte';
import type { Snippet } from 'svelte';

	interface RowProps {
		top: 'left' | 'right';
		header?: string;
		description?: string;
		left: Snippet;
		right: Snippet;
		bp: "lg" | "md"
	}
	let { top, header, description, left, right, bp }: RowProps = $props();
</script>

<section>
	{#if header !== undefined}
		<div class={`lg:pb-5 flex flex-row gap-5 ${top === 'right' ? 'flex-col-reverse lg:flex-row' : 'flex-wrap'}`}>
			<Text class="w-full flex-1 lg:w-[50%] lg:text-right border-b-0" element="h2">{header}</Text>
			<Text class="w-full lg:w-[50%]" element="p">{description}</Text>
		</div>
	{/if}
	<div class={`flex flex-row gap-5 ${top === 'right' ? 'flex-col-reverse lg:flex-row' : 'flex-wrap'}`}>
		<div class={`w-full flex-1 ${bp === "lg" ? "lg:w-[50%]":  "md:w-[50%]"}`}>
			{@render left()}
		</div>
		<div class={`w-full ${bp === "lg" ? "lg:w-[50%]":  "md:w-[50%]"}`}>
			{@render right()}
		</div>
	</div>
</section>
