<script lang="ts">
	import Text from '$lib/components/Text.svelte';
	import type { RecentPost } from '$lib/types/types';
	import { getImageSrc } from '$lib/utils/svelte-helper';
	import ReadMore from '../ReadMore.svelte';

	interface PostPreviewProps {
		post: RecentPost;
	}
	const { post }: PostPreviewProps = $props();
</script>

<a href={`/posts/${post.slug}`} aria-label={post.title} class="group">
	<div
		class="light:border-slate-100 transform overflow-hidden rounded-md border-2 border-solid bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:bg-slate-900"
	>
		<div class="overflow-hidden">
			<div class="relative flex h-28 w-full overflow-hidden md:h-32 lg:h-52">
				<img
					src={getImageSrc('posts', post.previewImage)}
					width="300"
					height="192"
					alt="post preview"
					class="w-full object-cover"
				/>
			</div>
		</div>
		<div class="p-4">
			<Text element="h3" class="duration-400 font-bold group-hover:text-secondary"
				>{post.title}</Text
			>
			<Text element="p" class="text-sm text-muted-foreground">{post.description}</Text>
			<ReadMore/>
		</div>
	</div>
</a>
