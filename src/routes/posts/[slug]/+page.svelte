<script lang="ts">
	import PostBlock from '$lib/components/pages/posts/PostBlock.svelte';
	import Spacer from '$lib/components/Spacer.svelte';
	import Text from '$lib/components/Text.svelte';
	import type { ParsedBlock } from '$lib/notion/server';
	import type { PostsResult } from '$lib/types/posts';
	import { getImageSrc } from '$lib/utils/svelte-helper';

	let { data }: { data: { blocks: ParsedBlock[]; post: PostsResult } } = $props();
	const post = data.post;
	const title = post.properties.Name.title[0].plain_text;
	const publishedDate = post.properties['Publish Date']?.date?.start;
	const editDate = new Date(
		post.properties['Last edited time']?.last_edited_time
	).toLocaleDateString();
	const description = post.properties['SEO Description'].rich_text[0].plain_text;
	const thumbnail = post.properties.thumbnail.files[0].file.url;
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
</svelte:head>

<Spacer height="50px" />
<section>
	<img
		width={800}
		loading="eager"
		class="w-full"
		src={getImageSrc('posts', thumbnail)}
		alt="thumbnail"
	/>
	<Spacer height="20px" />
	<Text element="h1">{title}</Text>
	<Text element="li" class="text-sm">Published: {publishedDate}</Text>
	<Text element="li" class="text-sm">Last Edit: {editDate}</Text>
</section>
<Spacer height="50px" />

{#each data.blocks as block}
	<PostBlock {block}></PostBlock>
{/each}
