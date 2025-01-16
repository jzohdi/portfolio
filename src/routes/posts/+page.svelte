<script lang="ts">
	import ReadMore from '$lib/components/pages/ReadMore.svelte';
	import Spacer from '$lib/components/Spacer.svelte';
	import Text from '$lib/components/Text.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import type { PostPreview } from '$lib/utils/svelte-helper';
	import { element } from 'three/tsl';

	const { data } = $props();
	const posts = data.posts as PostPreview[];
</script>

<!-- Define the snippet with a parameter 'product' -->
{#snippet postPreview(post: PostPreview)}
	<a href={`/posts/${post.slug}`} class="group">
		<Text element="h2" class="duration-400 font-bold group-hover:text-secondary">{post.title}</Text>
		<Text element="p">{post.description}</Text>
		{#each post.tags.split(',') as tag}
            {#if !!tag}
                <Badge variant="secondary" class="mt-3">{tag}</Badge>
            {/if}
        {/each}
		<ReadMore />
	</a>
{/snippet}

<Spacer height="20px"></Spacer>
<Text element="h1" class="text-secondary">Posts</Text>
<Spacer height="20px"></Spacer>
<ul class="">
	{#each posts as post}
		<li>
			<Spacer height="20px"></Spacer>
			{@render postPreview(post)}
			<Spacer height="36px"></Spacer>
		</li>
	{/each}
</ul>
