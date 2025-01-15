<script lang="ts">
	import type { PostsResults } from '$lib/types/posts.js';

	let { children, data } = $props();
</script>

<div class="m-auto max-w-[800px] pb-10">
	{@render children()}
</div>
