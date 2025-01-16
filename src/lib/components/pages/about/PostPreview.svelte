<script lang="ts">
	import Text from '$lib/components/Text.svelte';
	import type { RecentPost } from '$lib/types/types';
	import { getImageSrc } from '$lib/utils/svelte-helper';

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
			<Text element="p" class="duration-400 flex items-center group-hover:text-secondary"
				>Read more<svg
					xmlns="http://www.w3.org/2000/svg"
					class="duration-400 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" />
				</svg></Text
			>
		</div>
	</div>
</a>
