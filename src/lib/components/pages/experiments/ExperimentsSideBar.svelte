<script lang="ts">
	import RightIcon from '$lib/components/icons/RightIcon.svelte';
	import { makeDirectories } from '$lib/utils/experiments/makeDirectories';
	import FileOrDirectory from './FileOrDirectory.svelte';

	let isSidebarOpen = $state(false);

	function handleToggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
	}

	const { experiments } = $props();

	const experimentsDirectories = makeDirectories(experiments);
</script>

<div
	class={`${isSidebarOpen ? 'left-0' : 'right-[calc(100vw-30px)'} fixed top-12 z-10 grid h-screen grid-cols-6 overflow-hidden bg-white transition-all dark:bg-slate-950`}
>
	<div class="col-span-5 flex h-full px-3 pt-2">
		<div class="flex justify-center">
			{#each experimentsDirectories.subs as directory}
				<FileOrDirectory item={directory} path="/experiments/" />
			{/each}
		</div>
	</div>
	<button
		class="group col-span-1 flex h-full items-center transition-colors hover:border-r-[1px] hover:border-r-secondary"
		onclick={handleToggleSidebar}
	>
		<span class:rotate-180={isSidebarOpen} class="transition-transform">
			<RightIcon
				width={24}
				height={30}
				class="stroke-black transition-all group-hover:fill-secondary group-hover:stroke-secondary dark:stroke-white "
			/>
		</span>
	</button>
</div>
