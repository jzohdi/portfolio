<script lang="ts">
	import Text from '$lib/components/Text.svelte';
	import type { ParsedBlock, ParsedElement } from '$lib/notion/server';
	import { CodeBlock } from '@skeletonlabs/skeleton';
	import hljs from 'highlight.js';
	import 'highlight.js/styles/github-dark.min.css';
	import { storeHighlightJs } from '@skeletonlabs/skeleton';
	import LazyImage from '$lib/components/LazyImage.svelte';
	import Spacer from '$lib/components/Spacer.svelte';
	import { isValidUrl } from '$lib/utils/helper';
	storeHighlightJs.set(hljs);

	interface PostBlockProps {
		block: ParsedBlock;
	}
	const { block } = $props();
	const data = block as ParsedElement;
</script>

{#if data.type === 'paragraph'}
	{#if isValidUrl(data.content)}
		<div>
			<a
				class="cursor-pointer text-blue-500 visited:text-purple-600 hover:text-blue-700 hover:underline active:text-blue-800"
				href={data.content}
				target="_blank">{data.content}</a
			>
		</div>
	{:else}
		<Text element="p">{data.content}</Text>
	{/if}
{:else if data.type === 'h2'}
	<Text element="h2">{data.content}</Text>
{:else if data.type === 'h3'}
	<Text element="h3" class="pt-4">{data.content}</Text>
{:else if data.type === 'numbered_list'}
	<ol class="list-decimal py-5">
		{#each data.group as listItem}
			<Text element="li" class="ml-10">{listItem.content}</Text>
		{/each}
	</ol>
{:else if data.type === 'code'}
	<Spacer height="10px"></Spacer>
	<div class="bg-slate-900 p-4 text-white">
		<CodeBlock language={data.language} code={data.code} lineNumbers={true} />
	</div>
	<Spacer height="10px"></Spacer>
{:else if data.type === 'image'}
	<LazyImage imageUrl={data.url} />
{:else}
	<div>{JSON.stringify(block)}</div>
{/if}
