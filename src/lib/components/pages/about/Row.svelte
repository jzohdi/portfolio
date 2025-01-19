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

{#snippet renderLeftRightLg(left: Snippet, right: Snippet, top: RowProps['top'])}
<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
	<div class={`${top === "right" ? "order-2":  "lg:order-1"}`}>
		{@render left()}
	</div>
	<div class={`${top === "right" ? "order-1":  "lg:order-2"}`}>
		{@render right()}
	</div>
</div>	
{/snippet}

{#snippet renderLeftRightMd(left: Snippet, right: Snippet, top: RowProps['top'])}
<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
	<div class={`${top === "right" ? "order-2":  "md:order-1"}`}>
		{@render left()}
	</div>
	<div class={`${top === "right" ? "order-1":  "md:order-2"}`}>
		{@render right()}
	</div>
</div>		
{/snippet}

{#snippet renderHeader(header: RowProps['header'])}
	<Text class="w-full flex-1 lg:w-[50%] lg:text-right border-b-0" element="h2">{header}</Text>
{/snippet}

<section>
	{#if header !== undefined}
		<div class={`lg:pb-5 flex flex-row gap-5 ${top === 'right' ? 'flex-col-reverse lg:flex-row' : 'flex-wrap'}`}>
			<Text class="w-full flex-1 lg:w-[50%] lg:text-right border-b-0" element="h2">{header}</Text>
			<Text class="w-full lg:w-[50%]" element="p">{description}</Text>
		</div>
	{/if}
	{#if bp === "lg"}
		{@render renderLeftRightLg(left, right, top)}
	{:else}
		{@render renderLeftRightMd(left, right, top)}		
	{/if}
</section>


