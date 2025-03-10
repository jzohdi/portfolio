<script lang="ts">
	import Text from '$lib/components/Text.svelte';
	import type { ParsedElement, ParsedRichText } from '$lib/notion/server';
	import 'highlight.js/styles/github-dark.min.css';
	import { CodeBlock } from 'svhighlight';
	import LazyImage from '$lib/components/LazyImage.svelte';
	import Spacer from '$lib/components/Spacer.svelte';
	import { getImageSrc } from '$lib/utils/svelte-helper';
	import ATag from '$lib/components/ATag.svelte';
	import type { RichTextText } from '$lib/types/blocks';

	const { block } = $props();
	const data = block as ParsedElement;
	function isTextLink(content: ParsedRichText[0]) {
		return !!content?.link?.url;
	}
	if (data.type === 'paragraph') {
		const content = data.content;
	}

	function parseStringContent(content: RichTextText[]) {
		return content.map((c) => c.content).join(' ');
	}
</script>

{#snippet renderText(content: ParsedRichText)}
	{#each content as paragraphBlock}
		{#if isTextLink(paragraphBlock)}
			<ATag class="" href={paragraphBlock?.link?.url}>{paragraphBlock.content}</ATag>
		{:else if paragraphBlock.code === true}
			<Text element="code">{paragraphBlock.content}</Text>
		{:else}
			<span class={`${paragraphBlock.bold ? 'font-bold' : ''}`}>{paragraphBlock.content}</span>
		{/if}
	{/each}
{/snippet}

{#if data.type === 'paragraph'}
	<Text element="p" class="break-words pb-3">
		{@render renderText(data.content)}
	</Text>
{:else if data.type === 'h2'}
	<Text element="h2" class="pt-4">
		{@render renderText(data.content)}
	</Text>
{:else if data.type === 'h3'}
	<Text element="h3" class="pt-4">
		{@render renderText(data.content)}
	</Text>
{:else if data.type === 'numbered_list'}
	<ol class="list-decimal py-5">
		{#each data.group as listItem}
			<Text element="li" class="ml-10">
				{@render renderText(listItem.content)}
			</Text>
		{/each}
	</ol>
{:else if data.type === 'bulleted_list'}
	<ul class=" list-disc py-5">
		{#each data.group as listItem}
			<Text element="li" class="ml-10">
				{@render renderText(listItem.content)}
			</Text>
		{/each}
	</ul>
{:else if data.type === 'code'}
	<Spacer height="10px"></Spacer>
	<!-- <div class="bg-slate-900 p-4 text-white"> -->
	<CodeBlock language={data.language} code={data.code} />
	<!-- </div> -->
	<Spacer height="10px"></Spacer>
{:else if data.type === 'image'}
	<LazyImage imageUrl={getImageSrc('posts', data.url)} />
{:else}
	<div>{JSON.stringify(block)}</div>
{/if}
