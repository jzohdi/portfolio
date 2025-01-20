<script lang="ts">
	import ATag from '$lib/components/ATag.svelte';
	import FolderIcon from '$lib/components/icons/FolderIcon.svelte';
	import NavigateIcon from '$lib/components/icons/NavigateIcon.svelte';
	import type { Directory, File } from '$lib/utils/experiments/makeDirectories';
	import Self from './FileOrDirectory.svelte';

	const { item, path }: { item: Directory | File; path: string } = $props();
	const thisPath = path.endsWith('/') ? `${path}${item.name}` : `${path}-${item.name}`;
</script>

<div class="flex-cols flex">
	{#if item.type === 'file'}
		<ATag href={thisPath} class="ml-2 w-full p-1">
			<span class="group flex items-center">
				{item.name}
				<NavigateIcon
					width={14}
					height={14}
					class="ml-2 fill-blue-500 group-hover:text-secondary"
				/>
			</span>
		</ATag>
	{:else}
		<div>
			<span class="flex w-full items-center gap-2 p-1">
				<FolderIcon width={24} height={24} class={'fill-secondary'} />
				{item.name}
			</span>
			<div class="pl-4">
				{#each item.subs as child}
					<Self item={child} path={thisPath} />
				{/each}
			</div>
		</div>
	{/if}
</div>
