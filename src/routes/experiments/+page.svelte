<script lang="ts">
	import ATag from '$lib/components/ATag.svelte';
	import RightIcon from '$lib/components/icons/RightIcon.svelte';
	import ExperimentPreview from '$lib/components/pages/experiments/ExperimentPreview.svelte';
	import ExperimentsSideBar from '$lib/components/pages/experiments/ExperimentsSideBar.svelte';
	import FileOrDirectory from '$lib/components/pages/experiments/FileOrDirectory.svelte';
	import Spacer from '$lib/components/Spacer.svelte';
	import Text from '$lib/components/Text.svelte';
	import { makeDirectories } from '$lib/utils/experiments/makeDirectories.js';

	const { data } = $props();
	const experiments = data.experiments;
	let isSidebarOpen = $state(false);

	function handleToggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
	}
	// const experimentsDirectories = makeDirectories(experiments);
</script>

<!-- <ExperimentsSideBar {experiments} /> -->
<Spacer height="20px"></Spacer>
<Text element="h1">Experiments</Text>
<Spacer height="40px"></Spacer>
<div class="relative">
	<div class="grid grid-cols-1 sm:grid-cols-3">
		<div
			class={`${isSidebarOpen ? '!left-0' : 'right-[calc(100vw-30px)]'} fixed top-[130px] z-10 flex h-screen overflow-hidden bg-white transition-all dark:bg-slate-950 sm:relative sm:!left-0 sm:top-0 sm:col-span-1 sm:h-full`}
			class:border-t-2={isSidebarOpen}
		>
			<div class="h-full overflow-auto px-3 pt-2 sm:block sm:pt-1">
				<!-- <div class="flex justify-center"> -->
				{#each experiments as experiment}
					<div class="py-1">
						<ATag class="" href={`/experiments/${experiment.path}`}>
							{experiment.title}
						</ATag>
					</div>
				{/each}
				<!-- {#each experimentsDirectories.subs as directory}
							<FileOrDirectory item={directory} path="/experiments/" />
						{/each} -->
				<!-- </div> -->
			</div>
			<button
				class="group flex h-full items-center border-r-slate-500 transition-colors hover:border-r-secondary sm:hidden"
				onclick={handleToggleSidebar}
				class:border-r-2={isSidebarOpen}
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
		<ul class="col-span-1 pl-4 sm:col-span-2 sm:pl-0">
			{#each experiments as experiment}
				<ExperimentPreview {experiment} />
			{/each}
		</ul>
	</div>
</div>
